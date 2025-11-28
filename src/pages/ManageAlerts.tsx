import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  Tab,
  Tabs,
  Stack,
  Chip,
  Tooltip
} from '@mui/material'
import Grid from "@mui/material/Grid2"
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import axios from 'axios'
import dayjs from 'dayjs'
import config from '../config'
import { useLocation, useNavigate } from 'react-router-dom'

// --- Types ---
type Demographics = {
  gender?: string
  workStatus?: string
  civilStatus?: string
  barangay?: string
  fromAge?: number
  toAge?: number
}

type Schedule = {
  sendNow: boolean
  scheduledDate?: string
}

type Announcement = {
  _id: string
  title: string
  message: string
  image?: string
  affectedArea?: string
  demographics?: Demographics
  schedule?: Schedule
  createdAt: string
}

type MessageType = {
  _id: string
  title: string
  message: string
  type: 'General Information' | 'Warning and critical Messages' | 'Incident Report Confirmation' | 'Setting Reminder'
  image?: string
  recipients?: string[]
  affectedArea?: string
  demographics?: Demographics
  schedule?: Schedule
  createdAt: string
}

type NotificationType = {
  _id: string
  title: string
  message: string
  mainType: string
  subType: string
  images?: string[]
  affectedArea?: string
  demographics?: Demographics
  schedule?: Schedule
  createdAt: string
}

type CommunicationItem = Announcement | MessageType | NotificationType

const ManageAlerts: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation() // We access location.state directly in the effect
  
  const [currentTab, setCurrentTab] = useState<'announcements' | 'messages' | 'notifications'>('announcements')
  const [dataList, setDataList] = useState<CommunicationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [page, setPage] = useState<number>(1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  
  // Keeps the list strictly to 5 items to fit viewport comfortably
  const perPage = 5

  // Modals
  const [openAdd, setOpenAdd] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CommunicationItem | null>(null)

  // Form State
  const initialFormState = {
    title: '',
    message: '',
    type: '',
    mainType: '',
    subType: '',
    affectedArea: '',
    scheduleDate: '',
    sendNow: true,
    imageFile: null as File | null,
    imageFiles: [] as File[],
    gender: '',
    barangay: '',
    fromAge: '',
    toAge: ''
  }
  const [formData, setFormData] = useState(initialFormState)

  // Helper
  const getEndpoint = () => {
    switch (currentTab) {
      case 'announcements': return '/announcements'
      case 'messages': return '/messages'
      case 'notifications': return '/notifications'
      default: return '/announcements'
    }
  }

  // Fetch
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}${getEndpoint()}/`)
      setDataList(res.data)
      setLoading(false)
    } catch (e: any) {
      console.error(e)
      setSnackbar({ open: true, message: 'Error fetching data', severity: 'error' })
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearchQuery('')
    setPage(1)
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  // Filter & Pagination
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return dataList
    return dataList.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        (item as NotificationType).mainType?.toLowerCase().includes(q) ||
        (item as MessageType).type?.toLowerCase().includes(q)
      )
    })
  }, [searchQuery, dataList])

  const totalPages = Math.max(1, Math.ceil(filteredList.length / perPage))
  const pagedList = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredList.slice(start, start + perPage)
  }, [filteredList, page])

  // Handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'announcements' | 'messages' | 'notifications') => {
    setCurrentTab(newValue)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(p => ({ ...p, imageFile: e.target.files![0] }))
    }
  }

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(p => ({ ...p, imageFiles: Array.from(e.target.files!) }))
    }
  }

  const preparePayload = () => {
    const payload = new FormData()
    payload.append('title', formData.title)
    payload.append('message', formData.message)
    
    const scheduleObj = {
      sendNow: formData.sendNow,
      scheduledDate: formData.sendNow ? null : formData.scheduleDate
    }
    payload.append('schedule', JSON.stringify(scheduleObj))

    const demoObj: any = {}
    if (formData.gender) demoObj.gender = formData.gender
    if (formData.barangay) demoObj.barangay = formData.barangay
    if (formData.fromAge) demoObj.fromAge = Number(formData.fromAge)
    if (formData.toAge) demoObj.toAge = Number(formData.toAge)
    payload.append('demographics', JSON.stringify(demoObj))

    if (currentTab === 'announcements' || currentTab === 'messages' || currentTab === 'notifications') {
        if (formData.affectedArea) payload.append('affectedArea', formData.affectedArea)
    }

    if (currentTab === 'messages') {
      payload.append('type', formData.type)
    }

    if (currentTab === 'notifications') {
      payload.append('mainType', formData.mainType)
      payload.append('subType', formData.subType)
      formData.imageFiles.forEach((file) => {
        payload.append('images', file)
      })
    } else {
      if (formData.imageFile) {
        payload.append('image', formData.imageFile)
      }
    }

    return payload
  }

  // --- CONSOLIDATED CONSUMPTION EFFECT ---
  // This handles both changing the tab AND focusing the search,
  // THEN clears the state so a refresh doesn't trigger it again.
  useEffect(() => {
    const state = location.state as { highlightSearch?: boolean; alertType?: string } | null;

    if (state && (state.alertType || state.highlightSearch)) {
      
      // 1. Handle Alert Type (Tab Switch)
      if (state.alertType) {
        if (state.alertType === 'notification') setCurrentTab('notifications');
        else if (state.alertType === 'message') setCurrentTab('messages');
        else if (state.alertType === 'announcement') setCurrentTab('announcements');
      }

      // 2. Handle Highlight Search (Focus)
      if (state.highlightSearch) {
        // Use a timeout to ensure the DOM is ready and tabs have switched
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            setIsSearchFocused(true);
          }
        }, 300);
      }

      // 3. Clear the state (replaces current history entry)
      // This ensures that on refresh, location.state is empty
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmitAdd = async () => {
    try {
      const payload = preparePayload()
      await axios.post(`${config.GUARDIAN_SERVER_URL}${getEndpoint()}/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSnackbar({ open: true, message: 'Created successfully', severity: 'success' })
      setOpenAdd(false)
      setFormData(initialFormState)
      fetchData()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error creating item', severity: 'error' })
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedItem) return
    try {
       const payload = preparePayload()
       await axios.put(`${config.GUARDIAN_SERVER_URL}${getEndpoint()}/${selectedItem._id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
       })
       setSnackbar({ open: true, message: 'Updated successfully', severity: 'success' })
       setOpenEdit(false)
       setFormData(initialFormState)
       setSelectedItem(null)
       fetchData()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error updating item', severity: 'error' })
    }
  }

  const handleSubmitDelete = async () => {
    if (!selectedItem) return
    try {
      await axios.delete(`${config.GUARDIAN_SERVER_URL}${getEndpoint()}/${selectedItem._id}`)
      setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' })
      setOpenDelete(false)
      setSelectedItem(null)
      fetchData()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Error deleting item', severity: 'error' })
    }
  }

  const handleOpenEdit = (item: CommunicationItem) => {
    setSelectedItem(item)
    const isMsg = currentTab === 'messages'
    const isNotif = currentTab === 'notifications'
    const itemAny = item as any 

    setFormData({
      title: item.title,
      message: item.message,
      affectedArea: item.affectedArea || '',
      type: isMsg ? (item as MessageType).type : '',
      mainType: isNotif ? (item as NotificationType).mainType : '',
      subType: isNotif ? (item as NotificationType).subType : '',
      sendNow: item.schedule?.sendNow ?? true,
      scheduleDate: item.schedule?.scheduledDate ? dayjs(item.schedule.scheduledDate).format('YYYY-MM-DDTHH:mm') : '',
      gender: itemAny.demographics?.gender || '',
      barangay: itemAny.demographics?.barangay || '',
      fromAge: itemAny.demographics?.fromAge || '',
      toAge: itemAny.demographics?.toAge || '',
      imageFile: null,
      imageFiles: []
    })
    setOpenEdit(true)
  }

  // Constants
  const notificationMainTypes = [
    "Crime", "Environmental", "Fire Alarm", "Maritime", "News", "Traffic Situation", "Weather"
  ]

  const notificationSubTypes: Record<string, string[]> = {
    "Crime": ["Abandoned Package", "Burglar Alarm", "Domestic Violence", "Hit and Run", "Shooting Incident"],
    "Environmental": ["Earthquake", "Flash Flood", "Flood", "Gale Warning", "Landslide", "Volcanic Eruption"],
    "Fire Alarm": ["Bush Fire", "Chemical Fire", "Commercial Fire", "Fire Drill", "Industrial Fire", "Residential Fire", "Rubbish Fire"],
    "Maritime": ["Cancelled Trips", "Maritime Incident"],
    "News": ["Breaking News", "News Update", "Special News"],
    "Traffic Situation": ["Rerouting", "Road Closure", "Road Obstruction", "Road Repairs", "Traffic Situation", "Vehicle Collision"],
    "Weather": ["Heavy Rainfall", "Low Pressure Area", "Rainfall Update", "Severe Weather", "Thunderstorm", "Weather Forecast"]
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
      {/* --- App Bar (Fixed Height: 80px) --- */}
      <AppBar position="static" sx={{ backgroundColor: 'transparent', boxShadow: 'none', height: 80 }}>
        <Container disableGutters={true} maxWidth={false} sx={{ height: '100%' }}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '100%' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', px: 4 }}>
              <Typography variant="h6" component="div" sx={{ color: 'white' }}>
                Manage Alerts
              </Typography>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', px: 4 }}>
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
            </Grid>
          </Grid>
        </Container>
      </AppBar>

      {/* --- Main Content (Takes remaining height) --- */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: '2vh 2vw', // Dynamic padding based on viewport
        overflow: 'hidden' 
      }}>
        
        {/* --- Tabs --- */}
        <Box sx={{ mb: '1vh' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{ 
              '& .MuiTab-root': { 
                fontWeight: 700, 
                textTransform: 'none', 
                fontSize: '1rem',
                color: '#546e7a',
                minHeight: 40, // Reduce tab height slightly
                '&.Mui-selected': { color: '#1B4965' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#1B4965' }
            }}
          >
            <Tab label="Announcements" value="announcements" />
            <Tab label="Messages" value="messages" />
            <Tab label="Notifications" value="notifications" />
          </Tabs>
        </Box>

        {/* --- Data Container --- */}
        <Box sx={{ 
          flex: 1, 
          background: 'white', 
          borderRadius: 2, 
          boxShadow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden'
        }}>
          
          {/* Table Header (Fixed % Height) */}
          <Grid container sx={{ 
            borderBottom: '2px solid #f2f2f2', 
            background: '#f8fafa', 
            height: '8%', 
            alignItems: 'center', 
            px: 2,
            fontWeight: 600 
          }}>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Title</Grid>
            <Grid size={{ md: 3 }} sx={{ fontWeight: 600 }}>Details / Type</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Affected Area</Grid>
            <Grid size={{ md: 2 }} sx={{ fontWeight: 600 }}>Schedule</Grid>
            <Grid size={{ md: 3 }} sx={{ fontWeight: 600, textAlign: 'right', pr: 2 }}>Actions</Grid>
          </Grid>

          {/* Table Body (Dynamic Fill) */}
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
              // Using slice guarantees we only render perPage items, protecting layout
              // The outer Box flex column ensures they stretch
              pagedList.map((row, idx) => (
                <Grid container key={row._id} sx={{ 
                  height: '19%',
                  background: idx % 2 === 0 ? '#f8fbfa' : 'white', 
                  borderRadius: 2, 
                  boxShadow: 0, 
                  border: '1.5px solid #e0e0e0', 
                  alignItems: 'center', 
                  px: 1.5,
                  minHeight: '60px' // Allow shrinking
                }}>
                  
                  {/* Col 1: Title */}
                  <Grid size={{ md: 2 }} sx={{ display: 'flex', flexDirection: 'column'}}>
                    <Tooltip title={row.title} arrow placement="top-start">
                      <Box 
                        component="span" 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: 'clamp(14px, 1vw, 16px)',
                          // --- CSS Line Clamp Logic ---
                          display: '-webkit-box',
                          WebkitLineClamp: 3, // Limits to 3 lines
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'help', // Optional: changes cursor to indicate hoverable
                          marginRight: '10px'

                        }}
                      >
                        {row.title}
                      </Box>
                    </Tooltip>
                    <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#888' }}>
                      {dayjs(row.createdAt).format('MMM D, YYYY')}
                    </span>
                  </Grid>

                  {/* Col 2: Details / Type */}
                  <Grid size={{ md: 3 }} sx={{ display: 'flex', flexDirection: 'column', pr: 1 }}>
                     {'type' in row ? (
                       <Chip label={row.type} size="small" sx={{ width: 'fit-content', mb: 0.5, bgcolor: '#e3f2fd', color: '#1565c0', height: 20, fontSize: 10 }} />
                     ) : 'mainType' in row ? (
                       <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip label={row.mainType} size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', height: 20, fontSize: 10 }} />
                          <Chip label={row.subType} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                       </Box>
                     ) : (
                       <span style={{ fontStyle: 'italic', color: '#666', fontSize: 12 }}>Announcement</span>
                     )}
                     <span style={{ 
                       fontSize: 'clamp(11px, 0.9vw, 13px)', 
                       color: '#444', 
                       overflow: 'hidden', 
                       textOverflow: 'ellipsis', 
                       whiteSpace: 'nowrap',
                       marginTop: '4px' 
                     }}>
                       {row.message}
                     </span>
                  </Grid>

                  {/* Col 3: Area */}
                  <Grid size={{ md: 2 }} sx={{ fontSize: 'clamp(12px, 0.9vw, 14px)' }}>
                    {row.affectedArea || '—'}
                  </Grid>

                  {/* Col 4: Schedule */}
                  <Grid size={{ md: 2 }} sx={{ fontSize: 'clamp(12px, 0.9vw, 14px)' }}>
                    {row.schedule?.sendNow 
                      ? <span style={{ color: '#2e7d32', fontWeight: 600 }}>Sent Immediately</span> 
                      : dayjs(row.schedule?.scheduledDate).format('MMM D, h:mm A')
                    }
                  </Grid>

                  {/* Col 5: Actions */}
                  <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', pr: 1 }}>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#546e7a', borderRadius: 1, fontSize: 11, px: 2 }} onClick={() => { setSelectedItem(row); setOpenView(true); }}>View</Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#29516a', borderRadius: 1, fontSize: 11, px: 2 }} onClick={() => handleOpenEdit(row)}>Edit</Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#ef5350', borderRadius: 1, fontSize: 11, px: 2, '&:hover': { bgcolor: '#d32f2f' } }} onClick={() => { setSelectedItem(row); setOpenDelete(true); }}>Delete</Button>
                  </Grid>
                </Grid>
              ))
            )}
            
            {/* Fill empty space if items < 5 (Optional aesthetic choice, or let them stretch) */}
            {/* We let them stretch or use empty divs to keep spacing if list is short, but flex:1 handles it nicely usually */}
          </Box>

          {/* Pagination (Fixed % Height) */}
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

      {/* Floating Add Button (Positioned relative to viewport) */}
      <Box sx={{ position: 'fixed', bottom: '5vh', right: '3vw', zIndex: 100 }}>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: '#29516a', 
            width: '70px', 
            height: '70px', 
            borderRadius: '50%', 
            minWidth: 0, 
            boxShadow: 3, 
            p: 0 
          }} 
          onClick={() => {
            navigate(`/${currentTab}`) 
          }}
        >
          <AddIcon sx={{ fontSize: 40 }} />
        </Button>
      </Box>

      {/* --- MODALS (Keep standard layout for Modals as they overlay) --- */}
      
      {/* Add/Edit Modal */}
      <Dialog open={openAdd || openEdit} onClose={() => { setOpenAdd(false); setOpenEdit(false); }} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>
            {openEdit ? 'Edit' : 'Create'} {currentTab === 'announcements' ? 'Announcement' : currentTab === 'messages' ? 'Message' : 'Notification'}
          </DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Title" fullWidth size="small" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Message Body" fullWidth multiline rows={3} size="small" value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} />
            </Grid>

            {currentTab === 'messages' && (
               <Grid size={{ xs: 12 }}>
                 <FormControl fullWidth size="small">
                   <InputLabel>Message Type</InputLabel>
                   <Select value={formData.type} label="Message Type" onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}>
                     <MenuItem value="General Information">General Information</MenuItem>
                     <MenuItem value="Warning and critical Messages">Warning and critical Messages</MenuItem>
                     <MenuItem value="Incident Report Confirmation">Incident Report Confirmation</MenuItem>
                     <MenuItem value="Setting Reminder">Setting Reminder</MenuItem>
                   </Select>
                 </FormControl>
               </Grid>
            )}

            {currentTab === 'notifications' && (
              <>
                <Grid size={{ md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Main Type</InputLabel>
                    <Select value={formData.mainType} label="Main Type" onChange={(e) => setFormData(p => ({ ...p, mainType: e.target.value, subType: '' }))}>
                      {notificationMainTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ md: 6 }}>
                  <FormControl fullWidth size="small" disabled={!formData.mainType}>
                    <InputLabel>Sub Type</InputLabel>
                    <Select value={formData.subType} label="Sub Type" onChange={(e) => setFormData(p => ({ ...p, subType: e.target.value }))}>
                      {formData.mainType && notificationSubTypes[formData.mainType]?.map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid size={{ md: 6 }}>
               <TextField label="Affected Area (Barangay/City)" fullWidth size="small" value={formData.affectedArea} onChange={(e) => setFormData(p => ({ ...p, affectedArea: e.target.value }))} />
            </Grid>
            <Grid size={{ md: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
               <FormControlLabel control={<Checkbox checked={formData.sendNow} onChange={(e) => setFormData(p => ({ ...p, sendNow: e.target.checked }))} />} label="Send Now" />
            </Grid>
            {!formData.sendNow && (
               <Grid size={{ xs: 12 }}>
                 <TextField type="datetime-local" label="Schedule Date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={formData.scheduleDate} onChange={(e) => setFormData(p => ({ ...p, scheduleDate: e.target.value }))} />
               </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ color: '#666', mt: 1, mb: 1 }}>Demographics (Optional)</Typography>
            </Grid>
            <Grid size={{ md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select value={formData.gender} label="Gender" onChange={(e) => setFormData(p => ({ ...p, gender: e.target.value }))}>
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 3 }}>
              <TextField label="Barangay Filter" fullWidth size="small" value={formData.barangay} onChange={(e) => setFormData(p => ({ ...p, barangay: e.target.value }))} />
            </Grid>
            <Grid size={{ md: 3 }}>
              <TextField label="From Age" type="number" fullWidth size="small" value={formData.fromAge} onChange={(e) => setFormData(p => ({ ...p, fromAge: e.target.value }))} />
            </Grid>
            <Grid size={{ md: 3 }}>
              <TextField label="To Age" type="number" fullWidth size="small" value={formData.toAge} onChange={(e) => setFormData(p => ({ ...p, toAge: e.target.value }))} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ color: '#666', mt: 1, mb: 1 }}>Attachment</Typography>
              {currentTab === 'notifications' ? (
                 <input type="file" multiple accept="image/*" onChange={handleMultipleFilesChange} style={{ display: 'block' }} />
              ) : (
                 <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'block' }} />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 0 }}>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={() => { setOpenAdd(false); setOpenEdit(false); }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }} onClick={openEdit ? handleSubmitEdit : handleSubmitAdd}>{openEdit ? 'Save Changes' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
           <DialogTitle sx={{ color: 'white', fontSize: 24, fontWeight: 400, p: 2 }}>View Details</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          {selectedItem && (
            <Stack spacing={2}>
               <Box><Typography variant="caption" color="textSecondary">TITLE</Typography><Typography variant="h6">{selectedItem.title}</Typography></Box>
               <Box><Typography variant="caption" color="textSecondary">MESSAGE</Typography><Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.message}</Typography></Box>
               {'type' in selectedItem && <Box><Typography variant="caption" color="textSecondary">TYPE</Typography><Typography variant="body1">{(selectedItem as MessageType).type}</Typography></Box>}
               {'mainType' in selectedItem && <Box><Typography variant="caption" color="textSecondary">CATEGORY</Typography><Typography variant="body1">{(selectedItem as NotificationType).mainType} - {(selectedItem as NotificationType).subType}</Typography></Box>}
               <Box><Typography variant="caption" color="textSecondary">SCHEDULE</Typography><Typography variant="body1">{selectedItem.schedule?.sendNow ? 'Sent Immediately' : dayjs(selectedItem.schedule?.scheduledDate).format('MMM D, YYYY h:mm A')}</Typography></Box>
               {'image' in selectedItem && (selectedItem as Announcement).image && <Box><Typography variant="caption" color="textSecondary">IMAGE</Typography><img src={(selectedItem as Announcement).image} alt="Attachment" style={{ width: '100%', borderRadius: 8 }} /></Box>}
               {'images' in selectedItem && (selectedItem as NotificationType).images?.map((img, i) => <Box key={i}><Typography variant="caption" color="textSecondary">IMAGE {i+1}</Typography><img src={img} alt={`Attachment ${i}`} style={{ width: '100%', borderRadius: 8 }} /></Box>)}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button variant="contained" onClick={() => setOpenView(false)} sx={{ bgcolor: '#29516a' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontSize: 24, fontWeight: 500, p: 3, pb: 1 }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}><Typography>Are you sure you want to delete this? This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 1 }}>
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }} onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={handleSubmitDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default ManageAlerts