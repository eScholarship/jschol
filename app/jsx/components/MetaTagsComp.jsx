// ##### Meta Tags Component ##### //
{/* This component uses the react-meta-tags library to put title, description, and image tags in the header */}

import React from 'react'
import PropTypes from 'prop-types'
import MetaTags from 'react-meta-tags'

export default class MetaTagsComp extends React.Component
{
  static propTypes = {
    title: PropTypes.string.isRequired,
    contribs: PropTypes.string,
    abstract: PropTypes.string
  }

  stripHtml = str => {
    return str.replace(/<(?:.|\n)*?>/gm, '')
  }

  render() {
    let p = this.props
    let finalTitle = p.title ? this.stripHtml(p.title) : "eScholarship"
    let [descrip_on, abstract, descrip] = [1, '', p.contribs]
    if ((!p.contribs || p.contribs == '') && (!p.abstract || p.abstract == '')) { descrip_on = null }
    if (p.abstract && p.abstract != '') {
      abstract = this.stripHtml(p.abstract)
      descrip = descrip + " | Abstract: " + abstract
    }
    return (
      <MetaTags>
        <title>{finalTitle}</title>
        <meta id="meta-title" property="citation_title" content={finalTitle} />
        <meta id="og-title" property="og:title" content={finalTitle} />

        {/* Twitter specific config https://developer.twitter.com/en/docs/twitter-for-websites/webpage-properties/overview */}
        <meta name="twitter:widgets:autoload" content="off" />
        <meta name="twitter:dnt" content="on" />
        <meta name="twitter:widgets:csp" content="on" />

        { p.abstract && <meta id="meta-abstract" name="citation_abstract" content={abstract} /> }
        {descrip_on && <meta id="meta-description" name="description" content={descrip} /> }
        {descrip_on && <meta id="og-description" name="og:description" content={descrip} /> }
        <meta id="og-image" property="og:image" content="https://escholarship.org/images/escholarship-facebook2.jpg" />
        <meta id="og-image-width" property="og:image:width" content="1242" />
        <meta id="og-image-height" property="og:image:height" content="1242" />
        { this.props.children }
      </MetaTags>
    )
  }
}
