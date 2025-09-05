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
} from '@mui/material'
import Grid from "@mui/material/Grid2"
import SearchIcon from '@mui/icons-material/Search'
// removed add icon and add flow
import axios from 'axios'
import dayjs from 'dayjs'
import config from '../config'
import { getAddressFromCoordinates } from '../utils/geocoding'
import GuardianIcon from "../assets/images/icon.png"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import AddIcon from '@mui/icons-material/Add'



type Incident = {
  _id: string
  incidentType: string
  isVerified: boolean
  isResolved: boolean
  isFinished: boolean
  isAccepted: boolean
  acceptedAt?: string | null
  resolvedAt?: string | null
  onsceneAt?: string | null
  onSceneAt?: string | null
  user?: any
  dispatcher?: any
  opCen?: any
  opCenStatus?: 'idle' | 'connecting' | 'connected'
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
  isAcceptedResponder?: boolean
  responderStatus?: 'enroute' | 'onscene' | 'facility' | 'rtb' | null
  responderNotification?: 'unread' | 'read'
  responderCoordinates?: { lat: number | null; lon: number | null }
  selectedFacility?: any
  incidentDetails?: {
    incident?: string | null
    incidentDescription?: string | null
    coordinates?: {
      type: 'Point',
      coordinates: [number, number]
    }
  }
  createdAt?: string
  updatedAt?: string
}

const ManageReporting: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [page, setPage] = useState<number>(1)
  const perPage = 4

  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [openDelete, setOpenDelete] = useState<boolean>(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [openView, setOpenView] = useState<boolean>(false)
  const [openAdd, setOpenAdd] = useState<boolean>(false)
  const [viewAddress, setViewAddress] = useState<string>('—')
  const modalContentRef = useRef<HTMLDivElement>(null)

  // edit form
  const [editForm, setEditForm] = useState<{
    incidentType: string
    isVerified: boolean
    isAccepted: boolean
    isResolved: boolean
    isFinished: boolean
    incident?: string
    incidentDescription?: string
  }>({ incidentType: '', isVerified: false, isAccepted: false, isResolved: false, isFinished: false })

  // add form
  const [addForm, setAddForm] = useState<{
    incidentType: string
    userId: string
    incident?: string
    incidentDescription?: string
    lat?: string
    lon?: string
  }>({ incidentType: '', userId: '', incident: '', incidentDescription: '', lat: '', lon: '' })

  // Get logged-in user (dispatcher/opcen) for filtering
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const loggedInUser = userStr ? JSON.parse(userStr) : null

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/incidents/`)
      const list: Incident[] = res.data
      setIncidents(list)
      setLoading(false)
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error fetching incidents', severity: 'error' })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return incidents
    return incidents.filter((i) => {
      const fields: string[] = [
        i.incidentType || '',
        i.user?.firstName || '',
        i.user?.lastName || '',
        i.responder?.firstName || '',
        i.responder?.lastName || '',
        i.incidentDetails?.incident || '',
        i.incidentDetails?.incidentDescription || '',
      ]
      return fields.some((f) => f.toLowerCase().includes(q))
    })
  }, [searchQuery, incidents])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, incidents])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredIncidents.length / perPage)), [filteredIncidents.length])
  const pagedIncidents = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredIncidents.slice(start, start + perPage)
  }, [filteredIncidents, page])

  const handleOpenEdit = (row: Incident) => {
    setSelectedIncident(row)
    setEditForm({
      incidentType: row.incidentType || '',
      isVerified: !!row.isVerified,
      isAccepted: !!row.isAccepted,
      isResolved: !!row.isResolved,
      isFinished: !!row.isFinished,
      incident: row.incidentDetails?.incident || '',
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
    setAddForm({ incidentType: '', userId: '', incident: '', incidentDescription: '', lat: '', lon: '' })
  }

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
          incident: addForm.incident || null,
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

  useEffect(() => {
    const loadAddress = async () => {
      if (!openView || !selectedIncident) return;

      // --- THIS IS THE FIX ---
      // We now look for the coordinates array instead of lat/lon properties.
      const coords = selectedIncident.incidentDetails?.coordinates?.coordinates;

      // Check if the coords array exists and has two numbers
      if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const lon = coords[0]; // Longitude is the first element
        const lat = coords[1]; // Latitude is the second element
        
        setViewAddress('Loading address...');
        // Your existing geocoding function will now get the correct values
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
          incident: editForm.incident || null,
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
      // Soft delete by marking finished
      await axios.put(`${config.GUARDIAN_SERVER_URL}/incidents/update/${selectedIncident._id}`, { isFinished: true })
      setSnackbar({ open: true, message: 'Incident marked as finished', severity: 'success' })
      handleCloseDelete()
      fetchIncidents()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error deleting incident', severity: 'error' })
    }
  }

  const exportToPDF = async () => {
    if (!modalContentRef.current) return
    
    try {
      // Capture the modal content directly with padding
      const canvas = await html2canvas(modalContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: modalContentRef.current.scrollWidth + 80, // Add 80px for padding
        height: modalContentRef.current.scrollHeight + 80, // Add 80px for padding
        x: -40, // Offset to create padding effect
        y: -40
      })
      
      // Calculate PDF dimensions based on the actual content
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add the image to fit the content naturally
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      
      const fileName = `incident-report-${selectedIncident?.incidentType || 'unknown'}-${dayjs().format('YYYY-MM-DD-HH-mm')}.pdf`
      pdf.save(fileName)
      
      setSnackbar({ open: true, message: 'PDF exported successfully', severity: 'success' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      setSnackbar({ open: true, message: 'Error generating PDF', severity: 'error' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafcfc', position: 'relative', overflow: 'hidden' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none'}}>
        <Container disableGutters={true} maxWidth={false} sx={{}}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965',  height: '80px' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Manage Reporting
              </Typography>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <div style={{display: 'flex', width: '80%'}}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%'}}>
                  <SearchIcon style={{ position: 'absolute', left: '8px', color: '#757575', fontSize: '20px' }} />
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, color: 'black', height: '38px', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '1.1rem' }}
                  />
                </div>
              </div>
            </Grid>
          </Grid>
        </Container>
      </AppBar>

      <Box sx={{ background: 'white', borderRadius: 1, boxShadow: 0, p: 4, border: 'none' }}>
        <Grid container sx={{ borderBottom: '2px solid #f2f2f2', background: '#f8fafa', p: 1, fontWeight: 600 }}>
          <Grid size={{ md: 1 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Type</Grid>
          <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Details</Grid>
          <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>User</Grid>
          <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Responder</Grid>
          <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Status</Grid>
          <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Created</Grid>
          <Grid size={{ md: 1 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Actions</Grid>
        </Grid>

        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>
        ) : (
          pagedIncidents.map((row, idx) => (
            <Grid container key={row._id} sx={{ background: idx % 2 === 0 ? '#f8fbfa' : 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '1.5px solid #e0e0e0', alignItems: 'center', p: 0.5, minHeight: 70 }}>
              <Grid size={{ md: 1 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{row.incidentType}</span>
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', color: '#444', fontSize: 14 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(row.incidentDetails?.incident || '') + (row.incidentDetails?.incidentDescription ? ` – ${row.incidentDetails?.incidentDescription}` : '')}
                </span>
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
                {row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() : '—'}
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
                {row.responder ? `${row.responder.firstName || ''} ${row.responder.lastName || ''}`.trim() : '—'}
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, fontSize: 13 }}>
                <span style={{ padding: '2px 6px', borderRadius: 6, background: row.isVerified ? '#e8f5e9' : '#fff3e0', border: '1px solid #c8e6c9' }}>{row.isVerified ? 'Verified' : 'Unverified'}</span>
                <span style={{ padding: '2px 6px', borderRadius: 6, background: row.isAccepted ? '#e3f2fd' : '#f3e5f5', border: '1px solid #bbdefb' }}>{row.isAccepted ? 'Accepted' : 'Pending'}</span>
                <span style={{ padding: '2px 6px', borderRadius: 6, background: row.isResolved ? '#fff8e1' : '#fce4ec', border: '1px solid #ffe082' }}>{row.isResolved ? 'Resolved' : 'Unresolved'}</span>
                <span style={{ padding: '2px 6px', borderRadius: 6, background: row.isFinished ? '#eeeeee' : '#e0f7fa', border: '1px solid #e0e0e0' }}>{row.isFinished ? 'Finished' : 'Active'}</span>
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                {row.createdAt ? dayjs(row.createdAt).format('MMM D, YYYY h:mm A') : '—'}
              </Grid>
              <Grid size={{ md: 1 }} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', pr: 1 }}>
                <Button variant="contained" sx={{ bgcolor: '#546e7a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }} onClick={() => handleOpenView(row)}>View</Button>
                <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }} onClick={() => handleOpenEdit(row)}>Edit</Button>
                <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }} onClick={() => handleOpenDelete(row)}>Delete</Button>
              </Grid>
            </Grid>
          ))
        )}
        {!loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Page {page} of {totalPages}</Typography>
            <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </Box>
        )}
      </Box>

      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Button variant="contained" sx={{ bgcolor: '#29516a', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }} onClick={handleOpenAdd}>
          <AddIcon sx={{ fontSize: 48 }} />
        </Button>
      </Box>

      {/* Add flow removed by request */}

      {/* Edit Incident Modal */}
      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Edit Incident</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Incident Type</InputLabel>
            <Select label="Incident Type" value={editForm.incidentType} onChange={(e) => setEditForm((p) => ({ ...p, incidentType: e.target.value }))}>
              <MenuItem value="Fire">Fire</MenuItem>
              <MenuItem value="Medical">Medical</MenuItem>
              <MenuItem value="Police">Police</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Short Title" variant="outlined" size="small" fullWidth value={editForm.incident} onChange={(e) => setEditForm((p) => ({ ...p, incident: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Description" variant="outlined" size="small" fullWidth multiline rows={3} value={editForm.incidentDescription} onChange={(e) => setEditForm((p) => ({ ...p, incidentDescription: e.target.value }))} sx={{ mb: 2 }} />
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

      {/* Delete Confirmation Modal */}
      <Dialog open={openDelete} onClose={handleCloseDelete} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontSize: 24, fontWeight: 500, p: 3, pb: 1 }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Typography>
            Mark incident as finished? This hides it from active lists.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 1 }}>
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }} onClick={handleCloseDelete}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={submitDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add Incident Modal */}
      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Add Incident</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Incident Type</InputLabel>
            <Select label="Incident Type" value={addForm.incidentType} onChange={(e) => setAddForm((p) => ({ ...p, incidentType: e.target.value }))}>
              <MenuItem value="Fire">Fire</MenuItem>
              <MenuItem value="Medical">Medical</MenuItem>
              <MenuItem value="Police">Police</MenuItem>
            </Select>
          </FormControl>
          <TextField label="User ID" variant="outlined" size="small" fullWidth value={addForm.userId} onChange={(e) => setAddForm((p) => ({ ...p, userId: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Short Title" variant="outlined" size="small" fullWidth value={addForm.incident} onChange={(e) => setAddForm((p) => ({ ...p, incident: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Description" variant="outlined" size="small" fullWidth multiline rows={3} value={addForm.incidentDescription} onChange={(e) => setAddForm((p) => ({ ...p, incidentDescription: e.target.value }))} sx={{ mb: 2 }} />
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

      {/* View Incident Modal */}
      <Dialog open={openView} onClose={handleCloseView} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogContent sx={{ p: 3 }}>
          {selectedIncident && (
            <div ref={modalContentRef}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                {/* Left column */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }} data-pdf-section>
                  {/* <Box
                sx={{
                  // backgroundColor: 'green',
                  width: { xs: '100%', md: '5%' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #e0e0e0',
                  height: '100%',
                }}
              > */}
                <Box sx={{ width: 48, height: 48, bgcolor: 'red', borderRadius: 1 }}>
                <Avatar 
                        src={GuardianIcon}
                        alt="Avatar Image"
                        sx={{   
                          color: 'white',
                          width: 50, 
                          height: 50,
                          boxSizing: 'border-box',
                          borderRadius: '0',
                        }}
                      />
              </Box>
                    <Box>
                      <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 800 }}>GUARDIANPH</Typography>
                      <Typography variant="subtitle2" sx={{ lineHeight: 1, letterSpacing: 1 }}>AFTER INCIDENT REPORT</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2, mt: 5, ml: 2 }} data-pdf-section>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>TYPE: {selectedIncident.incidentType || '—'}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '75%', mt: 1 }} />
                  </Box>

                  <Box sx={{ mb: 2, ml: 2 }} data-pdf-section>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>REPORTED BY:</Typography>
                    <Typography variant="body2">{selectedIncident.user ? `${selectedIncident.user.firstName || ''} ${selectedIncident.user.lastName || ''}`.trim() : '—'}</Typography>
                    <Typography variant="body2">Volunteer ID: {selectedIncident.user?._id || '—'}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '75%', mt: 1 }} />
                  </Box>

                  <Box sx={{ mb: 2, ml: 2 }} data-pdf-section>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>LOCATION:</Typography>
                    <Typography variant="body2">{viewAddress}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '75%', mt: 1 }} />
                  </Box>

                  <Box sx={{ mb: 2, ml: 2 }} data-pdf-section>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>TYPE:</Typography>
                    <Typography variant="body2">{selectedIncident.incidentDetails?.incident || '—'}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '75%', mt: 1 }} />
                  </Box>

                  <Box sx={{ mb: 2, ml: 2 }} data-pdf-section>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>TIME RECEIVED</Typography>
                    <Typography variant="body2">{selectedIncident.createdAt ? dayjs(selectedIncident.createdAt).format('HH:mm:ss') : '—'}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '75%', mt: 1 }} />
                  </Box>

                  <Box sx={{ mb: 2, ml: 2 }} data-pdf-section>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>RESPONDERS DISPATCHED</Typography>
                    <Typography variant="body2">{selectedIncident.responder ? `${selectedIncident.responder.firstName || ''} ${selectedIncident.responder.lastName || ''}`.trim() : '—'}</Typography>
                    <Typography variant="body2">ONSCENE: {(selectedIncident.onSceneAt || selectedIncident.onsceneAt) ? dayjs(selectedIncident.onSceneAt || selectedIncident.onsceneAt).format('HH:mm:ss') : '—'}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '75%', mt: 1 }} />
                  </Box>

                  <Box sx={{ mt: 6, }} data-pdf-section>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>{selectedIncident.opCen?.name || 'Cloyd Bere Dedicatoria'}</Typography>
                    <Box sx={{ height: 2, bgcolor: '#222', width: '100%', mt: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center' }}>OPCEN ADMINISTRATOR</Typography>
                  </Box>
                </Box>

                {/* Right column */}
                <Box sx={{ width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }} data-pdf-section>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 170, height: 170, bgcolor: '#f5f5f5', border: '2px solid #e0e0e0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ width: 130, height: 130, bgcolor: '#e0e0e0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#9e9e9e' }}>QR</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>VERIFICATION VIDEO</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 170, height: 170, bgcolor: '#f5f5f5', border: '2px solid #e0e0e0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ width: 130, height: 130, bgcolor: '#e0e0e0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#9e9e9e' }}>QR</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>CHAT CONVERSATION</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 130, height: 130, bgcolor: '#f5f5f5', border: '2px solid #e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {selectedIncident.responder?.operationCenter?.profileImage ? (
                        <img 
                          src={selectedIncident.responder.operationCenter.profileImage} 
                          alt="OPCEN Logo"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }} 
                        />
                      ) : (
                        <Box sx={{ width: 120, height: 120, bgcolor: '#e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="h6" sx={{ color: '#9e9e9e' }}>LOGO</Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>OPCEN LOGO</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 5, textAlign: 'center' }} data-pdf-section>
                <Typography variant="caption" sx={{ color: '#e53935', fontWeight: 700 }}>
                  THIS REPORT IS NOT VALID WITHOUT THE SIGNATURE OF THE COMMAND CENTER ADMINISTRATOR
                </Typography>
              </Box>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button variant="contained" onClick={exportToPDF} sx={{ bgcolor: '#4caf50', textTransform: 'none' }}>
            Export PDF
          </Button>
          <Button variant="contained" onClick={handleCloseView} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default ManageReporting


