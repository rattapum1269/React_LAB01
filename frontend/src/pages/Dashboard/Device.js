import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Page from '../../containers/Page/Page'
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

// --- ฟังก์ชันสำหรับรัน Script (Sandbox) ---
const jsexe = (code) => {
  try {
    // eslint-disable-next-line no-new-func
    const func = new Function(`"use strict"; return (${code})`)
    return func()
  } catch (error) {
    throw error
  }
}

const DevicePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // ตรวจสอบโหมด: ถ้า id คือ 'create' แสดงว่าเป็นโหมดสร้างใหม่
  const isCreateMode = id === 'create'
  const collectionName = 'Device' // ชื่อ Collection ใน MongoDB

  const [loading, setLoading] = useState(!isCreateMode)
  const [saving, setSaving] = useState(false)
  
  // State ข้อมูล Device
  const [device, setDevice] = useState({
    _id: '',       // ID (สำคัญมาก)
    name: '',      // ชื่ออุปกรณ์
    type: 'Sensor',
    status: 'Active',
    script: '10 + 20 // ตัวอย่าง Script'
  })

  // State ผลลัพธ์การรัน Script
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // ฟังก์ชันดึง Token จาก LocalStorage
  function getAuth() {
    let auth = null
    const item = localStorage.getItem('base-shell:auth')
    if (item) auth = JSON.parse(item)
    return auth
  }

  // --- 1. Fetch Data (ทำงานเฉพาะโหมดแก้ไข) ---
  useEffect(() => {
    if (isCreateMode) return; // ถ้าสร้างใหม่ ไม่ต้องดึงข้อมูล

    async function fetchData() {
      try {
        const auth = getAuth()
        if (!auth) return

        const resp = await fetch('/api/preferences/readDocument', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
          body: JSON.stringify({
            collection: collectionName,
            query: { _id: id },
          })
        })
        const json = await resp.json()
        
        if (json && json.length > 0) {
          setDevice(json[0])
        } else {
          alert('Device not found')
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Fetch error:', error)
        alert('Error fetching device data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate, isCreateMode])

  // --- 2. Handle Change (เมื่อพิมพ์ข้อมูลในฟอร์ม) ---
  const handleChange = (e) => {
    const { name, value } = e.target
    setDevice(prev => ({ ...prev, [name]: value }))
  }

  // --- 3. Run Script ---
  const handleRunScript = () => {
    setError(null)
    setResult(null)
    try {
      if (!device.script.trim()) return
      const output = jsexe(device.script)
      setResult(output)
    } catch (err) {
      setError(err.message)
    }
  }

  // --- 4. Save Data (Create / Update) ---
  const handleSave = async () => {
    try {
      // Validation: ตรวจสอบค่าว่าง
      if (!device._id || !device._id.trim()) {
        alert('Please enter Device ID')
        return
      }
      if (!device.name || !device.name.trim()) {
        alert('Please enter Device Name')
        return
      }

      setSaving(true)
      const auth = getAuth()
      
      // เลือก URL API ตามโหมด
      const url = isCreateMode 
        ? '/api/preferences/createDocument' 
        : '/api/preferences/updateDocument'

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
        body: JSON.stringify({
          collection: collectionName,
          data: device, // ส่งข้อมูล Device ไปทั้งก้อน
        })
      })
      
      const json = await resp.json()
      console.log('Save result:', json)
      
      // ตรวจสอบผลลัพธ์จาก Backend (บางที Backend อาจส่ง error กลับมาในรูป JSON)
      if (json.error) {
         throw new Error(json.error)
      }

      alert('Saved successfully!')
      navigate('/dashboard') // บันทึกเสร็จกลับไปหน้า Dashboard
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving data: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // --- 5. Delete Data ---
  const handleDelete = async () => {
    if(!window.confirm(`Are you sure you want to delete "${device.name}"?`)) return;

    try {
        setSaving(true)
        const auth = getAuth()
        await fetch('/api/preferences/deleteDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
            body: JSON.stringify({
                collection: collectionName,
                query: { _id: device._id }
            })
        })
        alert('Deleted successfully')
        navigate('/dashboard')
    } catch (error) {
        console.error('Delete error:', error)
        alert('Delete failed')
        setSaving(false)
    }
  }

  // --- Render Loading ---
  if (loading) {
    return (
      <Page pageTitle="Loading...">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </Page>
    )
  }

  // --- Render Main Content ---
  return (
    <Page pageTitle={isCreateMode ? 'Add New Device' : `Edit Device : ${device.name}`}>
      <Box sx={{ padding: 2, maxWidth: 1000, margin: '0 auto', pb: 10 }}>
        
        {/* Toolbar ด้านบน */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="text" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'text.secondary' }}
          >
            Back to Dashboard
          </Button>

          {!isCreateMode && (
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleDelete}
            >
              Delete Device
            </Button>
          )}
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          
          {/* --- Section 1: Device Information --- */}
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
            Device Information
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Device ID"
                name="_id"
                value={device._id}
                onChange={handleChange}
                disabled={!isCreateMode} // ID แก้ไขไม่ได้ถ้าไม่ใช่โหมดสร้างใหม่
                variant={isCreateMode ? "outlined" : "filled"}
                helperText={isCreateMode ? "Must be unique" : "ID cannot be changed"}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={device.status || 'Active'}
                onChange={handleChange}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Device Name"
                name="name"
                value={device.name || ''}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Type"
                name="type"
                value={device.type || ''}
                onChange={handleChange}
                placeholder="e.g. Sensor, Gateway, Relay"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* --- Section 2: Script Editor --- */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mr: 1 }}>
              Script Editor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (JavaScript Execution Engine)
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Code Input */}
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                 <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  maxRows={12}
                  variant="standard" // ซ่อนขอบของ TextField เพื่อใช้ขอบของ Paper แทน
                  name="script"
                  value={device.script || ''}
                  onChange={handleChange}
                  placeholder="// Enter JavaScript code here..."
                  sx={{ 
                    p: 2,
                    bgcolor: '#fafafa',
                    fontFamily: 'monospace',
                    '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '14px', lineHeight: 1.6 }
                  }}
                  InputProps={{ disableUnderline: true }}
                />
              </Paper>
              
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                 <Button 
                   variant="contained" 
                   color="secondary" 
                   size="small" 
                   startIcon={<PlayArrowIcon />} 
                   onClick={handleRunScript}
                 >
                   Run Script
                 </Button>
              </Box>
            </Grid>

            {/* Output Display */}
            <Grid item xs={12} md={5}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  bgcolor: '#282c34', // Dark theme for console
                  color: '#fff',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#abb2bf', mb: 1, borderBottom: '1px solid #3e4451', pb: 1 }}>
                  Console Output:
                </Typography>
                
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {error ? (
                      <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
                        {error}
                      </Alert>
                    ) : result !== null ? (
                      <Typography variant="h4" sx={{ color: '#98c379', fontWeight: 'bold', wordBreak: 'break-all' }}>
                        {String(result)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#5c6370', fontStyle: 'italic' }}>
                        Waiting for execution...
                      </Typography>
                    )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* --- Action Buttons --- */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/dashboard')}
              sx={{ px: 4 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ px: 5 }}
            >
              {saving ? 'Saving...' : 'Save Device'}
            </Button>
          </Box>

        </Paper>
      </Box>
    </Page>
  )
}

export default DevicePage