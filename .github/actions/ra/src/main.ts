import * as github from '@actions/github'
import * as core from '@actions/core'
import axios from 'axios'
import {wait} from './wait'

import * as Octokit from '@octokit/rest'
const githubToken = process.env.GITHUB_TOKEN
const octokit = new Octokit.Octokit({
  auth: githubToken,
  request: {
    fetch: axios
  }
})

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

    const res = await axios.get(
      'https://0xka4ile08.execute-api.us-east-1.amazonaws.com/prod/https://0xka4ile08.execute-api.us-east-1.amazonaws.com/prod/'
    )

    // output the response body
    core.debug('YOOOOOO')
    core.debug(res.data)
    core.setOutput('response', res.data)
    core.setSecret(res.data)
    core.info('YOOOOOO')
    core.info(res.data)

    // core.debug('YOOOOOO')
    // core.debug(res.data)
    // core.setOutput('response', res.data)
    // core.setSecret(res.data)

    // // post the body as a comment on the PR
    // const commentBody = `Example PR comment`

    // // POST the comment to the PR using the GitHub API.
    // createComment(
    //   github.context.repo.owner,
    //   github.context.repo.repo,
    //   github.context.issue.number,
    //   commentBody
    // )

    // const message = 'Sample PR comment'
    // const github_token = core.getInput('GITHUB_TOKEN')

    // const context = github.context
    // if (context.payload.pull_request == null) {
    //   core.setFailed('No pull request found.')
    //   return
    // }
    // const pull_request_number = context.payload.pull_request.number

    // const new_comment = octokit.issues.createComment({
    //   ...context.repo,
    //   issue_number: pull_request_number,
    //   body: message
    // })

    return
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)

    return
  }
}

run()

// const createComment = async (
//   owner: string,
//   repo: string,
//   issueNumber: number,
//   comment: string
// ): Promise<void> => {
//   try {
//     await octokit.issues.createComment({
//       owner,
//       repo,
//       issue_number: issueNumber,
//       body: comment
//     })
//     return
//   } catch (error) {
//     return
//   }
// }
