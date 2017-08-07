// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Subscriber } from 'react-broadcast'

// Formatting buttons to display in the Trumbowyg editor
const TRUMBO_BUTTONS = [
  ['strong', 'em', 'underline', 'strikethrough'],
  ['superscript', 'subscript'],
  ['link', 'image-upload', 'file-upload'],
  'btnGrp-lists',
  ['horizontalRule'],
  ['removeformat']
]

export default class WysiwygEditorComp extends React.Component
{
  static propTypes = {
    html: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired
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
                   shouldInjectSvgIcons={false}
                   svgIconsPath="/bower_components/trumbowyg/dist/ui/icons.svg"
                   onChange={e => this.props.onChange(e.target.innerHTML)}
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
