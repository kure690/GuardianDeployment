import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  AppBar,
  Typography,
  Button,
  Box,
  Container,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Tooltip,
  Paper
} from '@mui/material'
import Grid from "@mui/material/Grid2"
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import CloseIcon from '@mui/icons-material/Close'

import axios from 'axios'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useLocation, useNavigate } from 'react-router-dom' // Added Imports

import config from '../config'
import { getAddressFromCoordinates } from '../utils/geocoding'
import GuardianIcon from "../assets/images/icon.png"
import QRCodeComponent from '../components/QRCode'

// --- TYPES ---
type Incident = {
  _id: string
  incidentType: string
  isVerified: boolean
  isResolved: boolean
  isFinished: boolean
  isAccepted: boolean
  acceptedAt?: string | null
  resolvedAt?: string | null
  onSceneAt?: string | null
  user?: {
    _id: string
    firstName: string
    lastName: string
  }
  dispatcher?: {
    firstName: string
    lastName: string
  }
  opCen?: {
    name: string
  }
  responder?: {
    _id: string
    firstName?: string
    lastName?: string
    operationCenter?: {
      _id: string
      profileImage?: string
      firstName?: string
      lastName?: string
    }
  }
  responderStatus?: 'enroute' | 'onscene' | 'facility' | 'rtb' | null
  incidentDetails?: {
    incidentDescription?: string | null
    coordinates?: {
      type: 'Point',
      coordinates: [number, number]
    }
  }
  createdAt?: string
  updatedAt?: string
}

const FRONTEND_RECORDINGS_URL = 'https://guardianphclient-7bajq.ondigitalocean.app/recordings';

const ManageReporting: React.FC = () => {
  // --- NAVIGATION & STATE ---
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Check for highlight request
  const locationState = (location as any).state as { highlightSearch?: boolean } | null;
  const highlightSearch = locationState?.highlightSearch;

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [page, setPage] = useState<number>(1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  
  const perPage = 5 

  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [openDelete, setOpenDelete] = useState<boolean>(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [openView, setOpenView] = useState<boolean>(false)
  const [openAdd, setOpenAdd] = useState<boolean>(false)
  const [viewAddress, setViewAddress] = useState<string>('—')
  
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Forms
  const [editForm, setEditForm] = useState<{
    incidentType: string
    isVerified: boolean
    isAccepted: boolean
    isResolved: boolean
    isFinished: boolean
    incidentDescription?: string
  }>({ incidentType: '', isVerified: false, isAccepted: false, isResolved: false, isFinished: false })

  const [addForm, setAddForm] = useState<{
    incidentType: string
    userId: string
    incidentDescription?: string
    lat?: string
    lon?: string
  }>({ incidentType: '', userId: '', incidentDescription: '', lat: '', lon: '' })

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const loggedInUser = userStr ? JSON.parse(userStr) : null

  useEffect(() => {
    if (highlightSearch && searchInputRef.current) {
      // Add a small timeout to ensure the element is ready and transition is complete
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [highlightSearch]);

  // --- API CALLS ---
  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/incidents/`)
      setIncidents(res.data)
      setLoading(false)
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error fetching incidents', severity: 'error' })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  // --- FILTERING ---
  const filteredIncidents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return incidents
    return incidents.filter((i) => {
      const formattedDate = i.createdAt ? dayjs(i.createdAt).format('MMM D, YYYY') : '';
      const fields: string[] = [
        i.incidentType || '',
        `${i.user?.firstName || ''} ${i.user?.lastName || ''}`,
        i.user?.firstName || '',
        i.user?.lastName || '',
        i.responder?.firstName || '',
        i.responder?.lastName || '',
        `${i.responder?.firstName || ''} ${i.responder?.lastName || ''}`,
        i.dispatcher?.firstName || '',
        i.dispatcher?.lastName || '',
        `${i.dispatcher?.firstName || ''} ${i.dispatcher?.lastName || ''}`,
        i.incidentDetails?.incidentDescription || '',
        formattedDate,
        i.createdAt || '',
        i._id || ''
      ]
      return fields.some((f) => f.toLowerCase().includes(q))
    })
  }, [searchQuery, incidents])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, incidents])

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / perPage))
  const pagedIncidents = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredIncidents.slice(start, start + perPage)
  }, [filteredIncidents, page])

  // --- HANDLERS ---
  const handleOpenEdit = (row: Incident) => {
    setSelectedIncident(row)
    setEditForm({
      incidentType: row.incidentType || '',
      isVerified: !!row.isVerified,
      isAccepted: !!row.isAccepted,
      isResolved: !!row.isResolved,
      isFinished: !!row.isFinished,
      incidentDescription: row.incidentDetails?.incidentDescription || '',
    })
    setOpenEdit(true)
  }
  const handleCloseEdit = () => {
    setOpenEdit(false)
    setSelectedIncident(null)
  }

  const handleOpenDelete = (row: Incident) => {
    setSelectedIncident(row)
    setOpenDelete(true)
  }
  const handleCloseDelete = () => {
    setOpenDelete(false)
    setSelectedIncident(null)
  }

  const handleOpenView = (row: Incident) => {
    setSelectedIncident(row)
    setOpenView(true)
  }
  const handleCloseView = () => {
    setOpenView(false)
    setSelectedIncident(null)
    setViewAddress('—')
  }

  const handleOpenAdd = () => setOpenAdd(true)
  const handleCloseAdd = () => {
    setOpenAdd(false)
    setAddForm({ incidentType: '', userId: '', incidentDescription: '', lat: '', lon: '' })
  }

  // --- SUBMISSIONS ---
  const submitAdd = async () => {
    try {
      if (!addForm.incidentType || !addForm.userId) {
        setSnackbar({ open: true, message: 'Incident type and userId are required', severity: 'error' })
        return
      }
      const payload: any = {
        incidentType: addForm.incidentType,
        userId: addForm.userId,
        opCen: loggedInUser?.id || null,
        incidentDetails: {
          incidentDescription: addForm.incidentDescription || null,
          coordinates: {
            lat: addForm.lat ? Number(addForm.lat) : null,
            lon: addForm.lon ? Number(addForm.lon) : null,
          },
        },
      }
      await axios.post(`${config.GUARDIAN_SERVER_URL}/incidents/`, payload)
      setSnackbar({ open: true, message: 'Incident created', severity: 'success' })
      handleCloseAdd()
      fetchIncidents()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error creating incident', severity: 'error' })
    }
  }

  // Address Loader for View
  useEffect(() => {
    const loadAddress = async () => {
      if (!openView || !selectedIncident) return;
      const coords = selectedIncident.incidentDetails?.coordinates?.coordinates;
      if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const lon = coords[0];
        const lat = coords[1];
        setViewAddress('Loading address...');
        const addr = await getAddressFromCoordinates(String(lat), String(lon));
        setViewAddress(addr);
      } else {
        setViewAddress('No location provided');
      }
    };
    loadAddress();
  }, [openView, selectedIncident]);

  const submitEdit = async () => {
    try {
      if (!selectedIncident) return
      const payload: any = {
        incidentType: editForm.incidentType,
        isVerified: editForm.isVerified,
        isAccepted: editForm.isAccepted,
        isResolved: editForm.isResolved,
        isFinished: editForm.isFinished,
        incidentDetails: {
          incidentDescription: editForm.incidentDescription || null,
        },
      }
      await axios.put(`${config.GUARDIAN_SERVER_URL}/incidents/update/${selectedIncident._id}`, payload)
      setSnackbar({ open: true, message: 'Incident updated', severity: 'success' })
      handleCloseEdit()
      fetchIncidents()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error updating incident', severity: 'error' })
    }
  }

  const submitDelete = async () => {
    try {
      if (!selectedIncident) return
      await axios.put(`${config.GUARDIAN_SERVER_URL}/incidents/update/${selectedIncident._id}`, { isFinished: true })
      setSnackbar({ open: true, message: 'Incident marked as finished', severity: 'success' })
      handleCloseDelete()
      fetchIncidents()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error deleting incident', severity: 'error' })
    }
  }

  // --- PDF EXPORT ---
  const exportToPDF = async () => {
    if (!modalContentRef.current) return
    try {
      const canvas = await html2canvas(modalContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })
      const imgWidth = 210 // A4 width mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      const fileName = `incident-report-${selectedIncident?._id}.pdf`
      pdf.save(fileName)
      setSnackbar({ open: true, message: 'PDF exported successfully', severity: 'success' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      setSnackbar({ open: true, message: 'Error generating PDF', severity: 'error' })
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fire': return '#d32f2f'; // Red
      case 'medical': return '#1976d2'; // Blue
      case 'police': return '#2e7d32'; // Green
      default: return '#757575'; // Grey
    }
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      flexDirection: 'column', 
      background: '#fafcfc', 
      overflow: 'hidden' 
    }}>
      {/* --- App Bar --- */}
      <AppBar position="static" sx={{ backgroundColor: 'transparent', boxShadow: 'none', height: 80 }}>
        <Container disableGutters={true} maxWidth={false} sx={{ height: '100%' }}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '100%' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', px: 4 }}>
              <Typography variant="h6" component="div" sx={{ color: 'white' }}>
                Manage Reporting
              </Typography>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', px: 4 }}>
              {/* --- UPDATED SEARCH BAR WITH HIGHLIGHT --- */}
              <div style={{display: 'flex', width: '80%'}}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%'}}>
                  <SearchIcon style={{ position: 'absolute', left: '8px', color: '#757575', fontSize: '20px' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    style={{ flex: 1, color: 'black', height: '38px', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '1.1rem' }}
                  />
                </div>
              </div>
              {/* --- END SEARCH BAR --- */}
            </Grid>
          </Grid>
        </Container>
      </AppBar>

      {/* --- Main Content --- */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: '2vh 2vw', 
        overflow: 'hidden' 
      }}>
        <Box sx={{ 
          flex: 1, 
          background: 'white', 
          borderRadius: 2, 
          boxShadow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden'
        }}>
          
          {/* Table Header */}
          <Grid container sx={{ 
            borderBottom: '2px solid #f2f2f2', 
            background: '#f8fafa', 
            height: '8%', 
            alignItems: 'center',
            px: 3.5 
          }}>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Incident ID</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Details</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Volunteer</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Dispatcher</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Responder Status</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600, textAlign: 'right', pr: 2}}>Actions</Grid>
          </Grid>

          {/* Table Body */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            p: '1vh 1vw',
            justifyContent: 'flex-start',
            gap: '1vh',
            overflowY: 'auto'
          }}>
            {loading ? (
               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading...</Box>
            ) : (
              pagedIncidents.map((row, idx) => (
                <Grid container key={row._id} sx={{ 
                  height: '19%', 
                  background: idx % 2 === 0 ? '#f8fbfa' : 'white', 
                  borderRadius: 2, 
                  boxShadow: 0, 
                  border: '1.5px solid #e0e0e0', 
                  alignItems: 'center', 
                  px: 1.5,
                  minHeight: '60px'
                }}>
                  {/* ID Column */}
                  <Grid size={{ md: 2 }} sx={{ display: 'flex', flexDirection: 'column'}}>
                     <Box component="span" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 'clamp(14px, 1vw, 16px)' }}>
                       {row._id.toUpperCase()}
                     </Box>
                     <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#888' }}>
                      {dayjs(row.createdAt).format('MMM D, YYYY')}
                    </span>
                  </Grid>

                  {/* Details Column */}
                  <Grid size={{ md: 2 }} sx={{ display: 'flex', flexDirection: 'column', pr: 1}}>
                    <Chip 
                        label={row.incidentType} 
                        size="small" 
                        sx={{ 
                          width: 'fit-content',
                          bgcolor: getTypeColor(row.incidentType), 
                          color: 'white', 
                          fontWeight: 700, 
                          mb: 0.5,
                          fontSize: '10px',
                          height: '20px'
                        }} 
                      />
                    <Tooltip title={row.incidentDetails?.incidentDescription || "No description"} arrow placement="top-start">
                      <span style={{ 
                        fontSize: 'clamp(11px, 0.9vw, 13px)', 
                        color: '#444', 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        cursor: 'help'
                      }}>
                        {row.incidentDetails?.incidentDescription || 'No description provided.'}
                      </span>
                    </Tooltip>
                  </Grid>

                  {/* Volunteer Column */}
                  <Grid size={{ md: 2 }} sx={{ fontSize: 'clamp(12px, 0.9vw, 14px)' }}>
                    {row.user ? `${row.user.firstName} ${row.user.lastName}` : '—'}
                  </Grid>

                  {/* Dispatcher Column */}
                  <Grid size={{ md: 2 }} sx={{ fontSize: 'clamp(12px, 0.9vw, 14px)', display: 'flex', flexDirection: 'column' }}>
                     <span>{row.dispatcher ? `${row.dispatcher.firstName} ${row.dispatcher.lastName}` : 'Unassigned'}</span>
                  </Grid>

                  {/* Responder Column */}
                  <Grid size={{ md: 2 }} sx={{ fontSize: 'clamp(12px, 0.9vw, 14px)', display: 'flex', flexDirection: 'column' }}>
                     <span>{row.responder ? `${row.responder.firstName} ${row.responder.lastName}` : 'Unassigned'}</span>
                     <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                       {row.responderStatus ? row.responderStatus.toUpperCase() : 'PENDING'}
                     </span>
                  </Grid>

                  {/* Actions Column */}
                  <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', pr: 2}}>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#546e7a', borderRadius: 1, fontSize: 11, px: 2 }} onClick={() => handleOpenView(row)}>View</Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#29516a', borderRadius: 1, fontSize: 11, px: 2 }} onClick={() => handleOpenEdit(row)}>Edit</Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#ef5350', borderRadius: 1, fontSize: 11, px: 2, '&:hover': { bgcolor: '#d32f2f' } }} onClick={() => handleOpenDelete(row)}>Delete</Button>
                  </Grid>
                </Grid>
              ))
            )}
          </Box>

          {/* Pagination */}
          {!loading && (
            <Box sx={{ 
              height: '8%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              px: 2, 
              borderTop: '1px solid #eee' 
            }}>
              <Typography variant="body2" sx={{ mr: 1, fontSize: '0.85rem' }}>Page {page} of {totalPages}</Typography>
              <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ minWidth: 30 }}>Prev</Button>
              <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} sx={{ ml: 1, minWidth: 30 }}>Next</Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: '5vh', right: '3vw', zIndex: 100 }}>
        <Button variant="contained" sx={{ bgcolor: '#29516a', width: '70px', height: '70px', borderRadius: '50%', minWidth: 0, boxShadow: 3, p: 0 }} onClick={handleOpenAdd}>
          <AddIcon sx={{ fontSize: 40 }} />
        </Button>
      </Box>

      {/* --- MODALS --- */}

      {/* Edit Modal */}
      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Edit Incident</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 3 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Incident Type</InputLabel>
            <Select label="Incident Type" value={editForm.incidentType} onChange={(e) => setEditForm((p) => ({ ...p, incidentType: e.target.value }))}>
              <MenuItem value="Fire">Fire</MenuItem>
              <MenuItem value="Medical">Medical</MenuItem>
              <MenuItem value="Police">Police</MenuItem>
              <MenuItem value="General">General</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Description" variant="outlined" size="small" fullWidth multiline rows={4} value={editForm.incidentDescription} onChange={(e) => setEditForm((p) => ({ ...p, incidentDescription: e.target.value }))} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
            <FormControlLabel control={<Checkbox checked={editForm.isVerified} onChange={(e) => setEditForm((p) => ({ ...p, isVerified: e.target.checked }))} />} label="Verified" />
            <FormControlLabel control={<Checkbox checked={editForm.isAccepted} onChange={(e) => setEditForm((p) => ({ ...p, isAccepted: e.target.checked }))} />} label="Accepted" />
            <FormControlLabel control={<Checkbox checked={editForm.isResolved} onChange={(e) => setEditForm((p) => ({ ...p, isResolved: e.target.checked }))} />} label="Resolved" />
            <FormControlLabel control={<Checkbox checked={editForm.isFinished} onChange={(e) => setEditForm((p) => ({ ...p, isFinished: e.target.checked }))} />} label="Finished" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 0 }}>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={handleCloseEdit}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }} onClick={submitEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Add Incident</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 3 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Incident Type</InputLabel>
            <Select label="Incident Type" value={addForm.incidentType} onChange={(e) => setAddForm((p) => ({ ...p, incidentType: e.target.value }))}>
              <MenuItem value="Fire">Fire</MenuItem>
              <MenuItem value="Medical">Medical</MenuItem>
              <MenuItem value="Police">Police</MenuItem>
            </Select>
          </FormControl>
          <TextField label="User ID (Volunteer)" variant="outlined" size="small" fullWidth value={addForm.userId} onChange={(e) => setAddForm((p) => ({ ...p, userId: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Description" variant="outlined" size="small" fullWidth multiline rows={4} value={addForm.incidentDescription} onChange={(e) => setAddForm((p) => ({ ...p, incidentDescription: e.target.value }))} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Latitude" variant="outlined" size="small" fullWidth value={addForm.lat} onChange={(e) => setAddForm((p) => ({ ...p, lat: e.target.value }))} />
            <TextField label="Longitude" variant="outlined" size="small" fullWidth value={addForm.lon} onChange={(e) => setAddForm((p) => ({ ...p, lon: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 0 }}>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={handleCloseAdd}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }} onClick={submitAdd}>Create Incident</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={handleCloseDelete} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontSize: 24, fontWeight: 500, p: 3, pb: 1 }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Typography>
            Mark incident as finished? This hides it from active lists.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 1 }}>
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }} onClick={handleCloseDelete}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={submitDelete}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* View Report Modal */}
      <Dialog 
        open={openView} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth 
        scroll="body"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }} 
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          {selectedIncident && (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                <Button variant="contained" color="success" startIcon={<PictureAsPdfIcon />} onClick={exportToPDF} sx={{ borderRadius: 20, textTransform: 'none', fontWeight: 600 }}>Export PDF</Button>
                <Button variant="contained" color="inherit" startIcon={<CloseIcon />} onClick={handleCloseView} sx={{ borderRadius: 20, textTransform: 'none', bgcolor: 'white', color: 'black' }}>Close</Button>
              </Box>

              <Paper 
                ref={modalContentRef}
                elevation={4}
                sx={{ 
                  width: '794px', 
                  minHeight: '1123px', 
                  bgcolor: 'white',
                  p: '40px', 
                  display: 'flex',
                  flexDirection: 'column',
                  mx: 'auto'
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, borderBottom: '3px solid #1B4965', pb: 2 }}>
                  <Avatar src={GuardianIcon} variant="square" sx={{ width: 80, height: 80, mr: 3 }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1B4965', lineHeight: 1, letterSpacing: -1 }}>GUARDIANPH</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#546e7a', letterSpacing: 2, textTransform: 'uppercase' }}>After Incident Report</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="caption" display="block" color="textSecondary">REPORT ID</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>#{selectedIncident._id.toUpperCase()}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 5, flex: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <SectionLabel>Incident Details</SectionLabel>
                    <DataRow label="Type" value={selectedIncident.incidentType} />
                    <DataRow label="Description" value={selectedIncident.incidentDetails?.incidentDescription} />
                    
                    <Box sx={{ height: 20 }} />
                    <SectionLabel>Location & Time</SectionLabel>
                    <DataRow label="Location" value={viewAddress} />
                    <DataRow label="Reported At" value={selectedIncident.createdAt ? dayjs(selectedIncident.createdAt).format('MMMM D, YYYY h:mm A') : '—'} />
                    <DataRow label="On Scene" value={(selectedIncident.onSceneAt || selectedIncident.onSceneAt) ? dayjs(selectedIncident.onSceneAt || selectedIncident.onSceneAt).format('h:mm A') : 'Pending'} />

                    <Box sx={{ height: 20 }} />
                    <SectionLabel>Personnel Involved</SectionLabel>
                    <DataRow label="Reporter (Volunteer)" value={selectedIncident.user ? `${selectedIncident.user.firstName} ${selectedIncident.user.lastName}` : '—'} />
                    <DataRow label="Dispatcher" value={selectedIncident.dispatcher ? `${selectedIncident.dispatcher.firstName} ${selectedIncident.dispatcher.lastName}` : 'System'} />
                    <DataRow label="Responder" value={selectedIncident.responder ? `${selectedIncident.responder.firstName} ${selectedIncident.responder.lastName}` : 'Pending Assignment'} />
                  
                    <Box sx={{ mt: 10, textAlign: 'center', width: '80%' }}>
                        <Box sx={{ borderBottom: '2px solid #333', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                            {selectedIncident.opCen?.name || 'Cloyd Bere Dedicatoria'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">COMMAND CENTER ADMINISTRATOR</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                      <a href={`${FRONTEND_RECORDINGS_URL}/${selectedIncident._id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Box sx={{ p: 2, border: '2px dashed #1B4965', borderRadius: 2, bgcolor: '#f5f9fc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <QRCodeComponent text={`${FRONTEND_RECORDINGS_URL}/${selectedIncident._id}`} size={140} />
                          <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, color: '#1B4965' }}>CLICK OR SCAN TO VIEW EVIDENCE</Typography>
                        </Box>
                      </a>
                    </Box>
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                       <Box sx={{ width: '100%', height: 160, bgcolor: '#f5f5f5', border: '1px solid #ddd', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="h5" color="disabled" fontWeight={700}>CHAT LOG</Typography>
                       </Box>
                       <Typography variant="caption" sx={{ mt: 1, fontWeight: 600, color: '#666' }}>CONVERSATION HISTORY</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 'auto' }}>
                      <Avatar src={selectedIncident.responder?.operationCenter?.profileImage} sx={{ width: 100, height: 100, border: '4px solid #f0f0f0', mx: 'auto', mb: 1 }}>OP</Avatar>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>OFFICIAL SEAL</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mt: 4, pt: 2, borderTop: '2px solid #eee', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 700, fontSize: '0.7rem' }}>
                    THIS REPORT IS NOT VALID WITHOUT THE SIGNATURE OF THE COMMAND CENTER ADMINSTRATOR
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// Helper Components
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="subtitle2" sx={{ color: '#1B4965', fontWeight: 800, textTransform: 'uppercase', mb: 1, borderBottom: '1px solid #ddd', pb: 0.5, width: '90%' }}>
    {children}
  </Typography>
)
const DataRow = ({ label, value }: { label: string, value: any }) => (
  <Box sx={{ mb: 1.5, ml: 1 }}>
    <Typography variant="caption" sx={{ color: '#777', fontWeight: 600, display: 'block', mb: 0 }}>{label.toUpperCase()}</Typography>
    <Typography variant="body1" sx={{ fontWeight: 500, color: '#222' }}>{value || '—'}</Typography>
  </Box>
)

export default ManageReporting