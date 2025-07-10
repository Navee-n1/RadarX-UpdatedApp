import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:5000'

export const uploadJD = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('uploaded_by', 'recruiter@hexaware.com')
  formData.append('project_code', 'HEX-MATCH')
  const res = await axios.post(`${BASE_URL}/upload-jd`, formData)
  return res.data
}

export const uploadResume = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', file.name)
  const res = await axios.post(`${BASE_URL}/upload-resume`, formData)
  return res.data
}

export const runMatching = async (jdId) => {
  const res = await axios.post(`${BASE_URL}/match/jd-to-resumes`, { jd_id: jdId })
  return res.data
}

export const sendEmailManual = async ({ jdId, to, cc, attachments }) => {
  const body = {
    jd_id: jdId,
    to,
    cc: cc.split(',').map(e => e.trim()),
    attachments,
    subject: `Top 3 Consultant Matches – JD ${jdId}`,
    body: `Dear Recruiter,\n\nPlease find the top 3 matches for JD ${jdId} attached.\n\nThank you,\nHexaware Recruitment Team`
  }
  const res = await axios.post(`${BASE_URL}/send-email/manual`, body)
  return res.data
}
