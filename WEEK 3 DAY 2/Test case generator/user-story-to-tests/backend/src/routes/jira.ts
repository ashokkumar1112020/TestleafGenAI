import express from 'express'
import { JiraService } from '../services/jiraService'

export const jiraRouter = express.Router()

jiraRouter.get('/:jiraId', async (req: express.Request, res: express.Response) => {
  try {
    const { jiraId } = req.params
    if (!jiraId || String(jiraId).trim().length === 0) {
      res.status(400).json({ error: 'jiraId is required' })
      return
    }

    const jira = new JiraService()

    try {
      const issue = await jira.getIssue(jiraId)
      res.json({ summary: issue.summary || '', description: issue.description || '', acceptanceCriteria: issue.acceptanceCriteria || '' })
    } catch (err: any) {
      if (err && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'Issue not found' })
        return
      }
      console.error('Error fetching JIRA issue:', err)
      res.status(502).json({ error: 'Failed to fetch from JIRA' })
    }
  } catch (error) {
    console.error('Error in /api/jira route:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
