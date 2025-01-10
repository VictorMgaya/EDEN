import Head from 'next/head'

const Metadata = ({
  title = "EDEN - The Resouce Analysis Engine (RAE) ",
  description = "The eden Resouce Analysis Engine (RAE) is the platform dedicated at analysin the natural resources for the purpose of enhancing their utilization ",
image = "https://www.edenapp.site/eden.svg",
  url = "https://www.edenapp.site",
}) => {
  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="keywords" content="digital garden, knowledge management, note-taking, personal wiki, EDEN" />
      <meta name="author" content="EDEN" />
      <link rel="canonical" href={url} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export default Metadata
