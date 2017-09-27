// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Subscriber } from 'react-broadcast'

// Formatting buttons to display in the Trumbowyg editor
const TRUMBO_BUTTONS = [
  ['strong', 'em', 'underline'],
  ['formatting'],
  ['link', 'image-upload', 'file-upload'],
  'btnGrp-lists',
  ['horizontalRule'],
  ['superscript', 'subscript', 'strikethrough'],
  ['removeformat']
]

export default class WysiwygEditorComp extends React.Component
{
  static propTypes = {
    html: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired,
    buttons: PropTypes.array
  }

  componentWillMount() {
    this.id = "trubmo-" + (new Date().getTime())
    this.initialHTML = this.props.html
    this.props.onChange(this.props.html) // initialize newText
  }

  render() {
  let buttons = this.props.buttons ? this.props.buttons : TRUMBO_BUTTONS 
  return(
    <Subscriber channel="cms">
      { cms => cms.modules &&
        <cms.modules.Trumbowyg 
                   id={this.id}
                   buttons={buttons}
                   data={this.initialHTML}
                   shouldInjectSvgIcons={false}
                   svgIconsPath="/bower_components/trumbowyg/dist/ui/icons.svg"
                   onChange={e => this.props.onChange(e.target.innerHTML)}
                   disabled={this.props.disabled}
                   plugins={{
                    // Add parameters to uploadImage plugin
                    uploadImage: {
                        serverPath: `/api/unit/${this.props.unit}/uploadEditorImg?username=${cms.username}&token=${cms.token}`,
                        fileFieldName: 'image',
                        urlPropertyName: 'link'
                    },
                    // Add parameters to uploadFile plugin
                    uploadFile: {
                        serverPath: `/api/unit/${this.props.unit}/uploadEditorFile?username=${cms.username}&token=${cms.token}`,
                        fileFieldName: 'file',
                        urlPropertyName: 'link'
                    }
                  }}/>
      }
    </Subscriber>
  )}
}
