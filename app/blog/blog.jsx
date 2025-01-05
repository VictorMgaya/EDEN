import React from 'react'
import PropTypes from 'prop-types'
import Link from 'next/link'

const analytics = props => {
  return (
    <div>
      <Link href="/Blog/blog">
        <button type="button">Go to Blog</button>
      </Link>
    </div>
  )
}

analytics.propTypes = {}

export default analytics