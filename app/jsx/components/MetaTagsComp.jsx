// ##### Meta Tags Component ##### //
{/* This component uses the react-meta-tags library to put title, description, and image tags in the header */}

import React from 'react'
import PropTypes from 'prop-types'
import MetaTags from 'react-meta-tags'

export default class MetaTagsComp extends React.Component
{
  static propTypes = {
    title: PropTypes.string.isRequired,
    descrip: PropTypes.string
  }

  stripHtml = str => {
    return str.replace(/<(?:.|\n)*?>/gm, '')
  }

  render() {
    let finalTitle = this.props.title ? this.stripHtml(this.props.title) : "eScholarship"
    let descrip = this.props.descrip ? this.stripHtml(this.props.descrip) : ''
    if (finalTitle.indexOf("eScholarship") < 0)
      finalTitle = finalTitle + " - eScholarship"
    return (
      <MetaTags>
        <title>{finalTitle}</title>
        <meta id="meta-title" property="citation_title" content={finalTitle} />
        <meta id="og-title" property="og:title" content={finalTitle} />
        { this.props.descrip && <meta id="meta-description" name="description" content={descrip} /> }
        { this.props.descrip && <meta id="meta-abstract" name="citation_abstract" content={descrip} /> }
        { this.props.descrip && <meta id="og-description" name="og:description" content={descrip} /> }
        <meta id="og-image" property="og:image" content="https://escholarship.org/images/escholarship-facebook2.jpg" />
        <meta id="og-image-width" property="og:image:width" content="1242" />
        <meta id="og-image-height" property="og:image:height" content="1242" />
        { this.props.children }
      </MetaTags>
    )
  }
}
