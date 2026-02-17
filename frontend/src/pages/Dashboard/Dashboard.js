import React, { useState, useEffect } from 'react'
import Page from '../../containers/Page/Page'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Checkbox,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ComputerIcon from '@mui/icons-material/Computer'
import DeleteIcon from '@mui/icons-material/Delete'

const Dashboard = () => {
  const intl = useIntl()
  const navigate = useNavigate()

  // State สำหรับเก็บข้อมูล
  const [devices, setDevices] = useState([]) // เริ่มต้นเป็น array ว่าง (ไม่มี Mock data แล้ว)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([]) // เก็บ ID ของรายการที่ถูกติ๊กเลือก

  // ฟังก์ชันดึง Token
  function getAuth() {
    let auth = null
    const item = localStorage.getItem('base-shell:auth')
    if (item) auth = JSON.parse(item)
    return auth
  }

  // ฟังก์ชันดึงข้อมูลจาก API จริง
  async function fetchDevices() {
    try {
      const auth = getAuth()
      if (!auth) return

      const resp = await fetch('/api/preferences/readDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
        body: JSON.stringify({
          collection: 'Device', // ดึงจาก Collection 'Device'
          query: {},
        })
      })
      
      const json = await resp.json()
      if (Array.isArray(json)) {
        setDevices(json)
        setSelected([]) // เคลียร์การเลือกทุกครั้งที่โหลดใหม่
      } else {
        setDevices([])
      }

    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // โหลดข้อมูลเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    fetchDevices()
  }, [])


  // --- Logic การเลือก (Selection) ---

  // 1. เลือกทั้งหมด / ยกเลิกทั้งหมด
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelecteds = devices.map((n) => n._id)
      setSelected(newSelecteds)
      return
    }
    setSelected([])
  }

  // 2. เลือกทีละรายการ
  const handleSelectOne = (event, id) => {
    event.stopPropagation() // ป้องกันไม่ให้ Event ทะลุไปกดคลิกการ์ด (เพื่อ Edit)
    
    const selectedIndex = selected.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }
    setSelected(newSelected)
  }

  // 3. ลบรายการที่เลือก (Bulk Delete)
  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selected.length} devices?`)) return

    const auth = getAuth()
    try {
      // วนลูปส่งคำสั่งลบทีละตัว
      for (let id of selected) {
         await fetch('/api/preferences/deleteDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'authorization': auth.token },
            body: JSON.stringify({
              collection: 'Device',
              query: { _id: id },
            })
         })
      }
      // ลบเสร็จโหลดข้อมูลใหม่
      fetchDevices()
      alert('Deleted successfully')

    } catch (error) {
      console.error(error)
      alert('Delete failed')
    }
  }

  return (
    <Page pageTitle={intl.formatMessage({ id: 'dashboard', defaultMessage: 'Dashboard' })}>
      <Box sx={{ padding: 3 }}>

        {/* --- Header & Toolbar --- */}
        <Paper 
          elevation={1} 
          sx={{ 
            mb: 4, 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: selected.length > 0 ? '#e3f2fd' : '#fff' // เปลี่ยนสีถ้ามีการเลือก
          }}
        >
          {/* ฝั่งซ้าย: Checkbox All และข้อความ */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              color="primary"
              indeterminate={selected.length > 0 && selected.length < devices.length}
              checked={devices.length > 0 && selected.length === devices.length}
              onChange={handleSelectAll}
              disabled={devices.length === 0} // ถ้าไม่มีข้อมูล ห้ามกด
            />
            <Typography variant="h6" fontWeight="bold" sx={{ ml: 1 }}>
              {selected.length > 0 
                ? `${selected.length} Selected` 
                : `Connected Devices (${devices.length})`
              }
            </Typography>
          </Box>
          
          {/* ฝั่งขวา: ปุ่ม Action */}
          <Box>
            {selected.length > 0 ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{ mr: 2 }}
              >
                Delete Selected
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => navigate('/dashboard/create')} 
              >
                Add Device
              </Button>
            )}
          </Box>
        </Paper>

        <Divider sx={{ mb: 4 }} />

        {/* --- Content: รายการ Device Cards --- */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {devices.map((device) => {
              const isSelected = selected.indexOf(device._id) !== -1;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={device._id}>
                  <Card
                    elevation={isSelected ? 4 : 2}
                    sx={{
                      height: '100%',
                      position: 'relative', // เพื่อวาง checkbox แบบ absolute
                      transition: '0.3s',
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                      border: isSelected ? '2px solid #1976d2' : '1px solid #eee',
                      bgcolor: isSelected ? '#f5f9ff' : '#fff'
                    }}
                    // กดที่ตัวการ์ด -> ไปหน้า Edit
                    onClick={() => navigate(`/dashboard/${device._id}`)}
                  >
                    {/* Checkbox มุมขวาบนของการ์ด */}
                    <Box sx={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}>
                       <Checkbox 
                          checked={isSelected}
                          onClick={(e) => handleSelectOne(e, device._id)} // กด Checkbox -> แค่เลือก
                       />
                    </Box>

                    <CardContent sx={{ textAlign: 'center', p: 3, pt: 4 }}>
                      <ComputerIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: device.status === 'Active' ? 'primary.main' : 'text.disabled', 
                          mb: 2 
                        }} 
                      />
                      <Typography variant="h6" gutterBottom noWrap>
                        {device.name || 'Unnamed Device'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Type: {device.type || '-'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1.5, py: 0.5,
                          borderRadius: 10,
                          fontWeight: 'bold',
                          bgcolor: device.status === 'Active' ? '#e8f5e9' : '#f5f5f5',
                          color: device.status === 'Active' ? '#2e7d32' : '#757575'
                        }}
                      >
                        {device.status || 'Unknown'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {/* กรณีไม่มีข้อมูล */}
            {devices.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 5, textAlign: 'center', border: '2px dashed #e0e0e0', borderRadius: 2, color: 'text.secondary' }}>
                  <Typography variant="body1" gutterBottom>No devices found.</Typography>
                  <Button variant="outlined" onClick={() => navigate('/dashboard/create')}>
                    Create your first device
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}

      </Box>
    </Page>
  )
}

export default Dashboard