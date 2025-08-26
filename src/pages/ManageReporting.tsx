import React, { useEffect, useMemo, useState } from 'react'
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
} from '@mui/material'
import Grid from "@mui/material/Grid2"
import SearchIcon from '@mui/icons-material/Search'
// removed add icon and add flow
import axios from 'axios'
import dayjs from 'dayjs'
import config from '../config'

type Incident = {
  _id: string
  incidentType: string
  isVerified: boolean
  isResolved: boolean
  isFinished: boolean
  isAccepted: boolean
  acceptedAt?: string | null
  resolvedAt?: string | null
  user?: any
  dispatcher?: any
  opCen?: any
  opCenStatus?: 'idle' | 'connecting' | 'connected'
  responder?: any
  isAcceptedResponder?: boolean
  responderStatus?: 'enroute' | 'onscene' | 'facility' | 'rtb' | null
  responderNotification?: 'unread' | 'read'
  responderCoordinates?: { lat: number | null; lon: number | null }
  selectedFacility?: any
  incidentDetails?: {
    incident?: string | null
    incidentDescription?: string | null
    coordinates?: { lat: number | null; lon: number | null }
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
              <MenuItem value="Crime">Crime</MenuItem>
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

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
        <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default ManageReporting


