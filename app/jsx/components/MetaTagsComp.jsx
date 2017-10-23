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
    if (finalTitle.indexOf("eScholarship") < 0)
      finalTitle = finalTitle + " - eScholarship"
    return (
      <MetaTags>
        <title>{finalTitle}</title>
        <meta id="og-title" property="og:title" content={finalTitle} />
        { this.props.descrip &&
          <meta id="meta-description" name="description" content={this.stripHtml(this.props.descrip)} />
        }
        <meta id="og-image" property="og:image" content="https://escholarship.org/images/escholarship-facebook.png" />
        { this.props.children }
      </MetaTags>
    )
  }
}
