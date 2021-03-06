import { NextApiRequest, NextApiResponse } from 'next'

import { request as graphqlRequest, gql } from 'graphql-request'

const query = gql`
  query getPageContent($id: Int!) {
    pages {
      single(id: $id) {
        render
      }
    }
  }
`

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { pageId } = request.query
  try {
    const result = await graphqlRequest(
      'https://wagdie.wiki/graphql',
      query,
      { id: Number(pageId) },
      {
        authorization: `Bearer ${process.env.WIKI_API_KEY}`,
      }
    )
    response.end(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <base href="https://wagdie.wiki/" />
        </head>
        <body>
        ${result.pages.single.render}
        </body>
      </html>
    `)
  } catch (err) {
    response.status(404).end('This page does not exist')
  }
}
