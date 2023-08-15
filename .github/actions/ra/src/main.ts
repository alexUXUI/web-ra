import * as github from '@actions/github'
import * as core from '@actions/core'
import {wait} from './wait'

import * as Octokit from '@octokit/rest'
const githubToken = process.env.GITHUB_TOKEN
const octokit = new Octokit.Octokit({auth: githubToken})

async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())

    // make a GET request to this URL https://0xka4ile08.execute-api.us-east-1.amazonaws.com/prod/
    // and set the response body as the output

    const response = await fetch(
      'https://0xka4ile08.execute-api.us-east-1.amazonaws.com/prod/'
    )
    const body = await response.text()

    core.setOutput('response', body)
    core.setSecret(body)

    // post the body as a comment on the PR
    const commentBody = `Example PR comment`

    // POST the comment to the PR using the GitHub API.
    createComment(
      github.context.repo.owner,
      github.context.repo.repo,
      github.context.issue.number,
      commentBody
    )

    return
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)

    return
  }
}

run()

const createComment = async (
  owner: string,
  repo: string,
  issueNumber: number,
  comment: string
): Promise<void> => {
  try {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: comment
    })
    return
  } catch (error) {
    return
  }
}
