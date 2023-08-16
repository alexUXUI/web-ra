import * as github from '@actions/github'
import * as core from '@actions/core'
import axios from 'axios'

import * as Octokit from '@octokit/rest'

async function run(): Promise<void> {
  try {
    const res = await axios.get(
      'https://0xka4ile08.execute-api.us-east-1.amazonaws.com/prod/https://0xka4ile08.execute-api.us-east-1.amazonaws.com/prod/'
    )

    // core.info(JSON.stringify(res.data))

    const message = 'Sample PR comment'
    const someVar = 'test'

    const context = github.context
    if (context.payload.pull_request == null) {
      core.setFailed('No pull request found.')
      return
    }

    const pull_request_number = context.payload.pull_request.number

    const githubToken = process.env.TOKEN

    core.info(`Github Token: ${githubToken}`)

    const octokit = new Octokit.Octokit({
      auth: githubToken,
      request: {
        fetch: axios
      }
    })

    const new_comment = octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: message
    })

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
