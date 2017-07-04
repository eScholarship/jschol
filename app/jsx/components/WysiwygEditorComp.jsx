// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Subscriber } from 'react-broadcast'

// Formatting buttons to display in the Trumbowyg editor
const TRUMBO_BUTTONS = [
  ['strong', 'em', 'underline', 'strikethrough'],
  ['superscript', 'subscript'],
  ['link'],
  ['insertImage'],
  'btnGrp-lists',
  ['horizontalRule'],
  ['removeformat']
]

export default class WysiwygEditorComp extends React.Component
{
  static propTypes = {
    html: PropTypes.string.isRequired,
  }

  componentWillMount() {
    this.props.onChange(this.props.html) // initialize newText
  }

  render() { return(
    <Subscriber channel="cms">
      { cms => cms.modules &&
        <cms.modules.Trumbowyg id='react-trumbowyg'
                   buttons={TRUMBO_BUTTONS}
                   data={this.props.html}
                   onChange={e => this.props.onChange(e.target.innerHTML)} />
      }
    </Subscriber>
  )}
}
