// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import Contexts from '../contexts.jsx'

// Formatting buttons to display in the Trumbowyg editor
const TRUMBO_BUTTONS = [
  ['strong', 'em', 'underline'],
  ['formatting'],
  ['fancyCreateLink', 'unlink'],
  ['image-upload', 'file-upload'],
  ['unorderedList', 'orderedList'],
  ['align'],
  ['horizontalRule'],
  ['superscript', 'subscript', 'strikethrough'],
  ['fancyRemoveFormat']
]

export default class WysiwygEditorComp extends React.Component
{
  static propTypes = {
    html: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired,
    imageContext: PropTypes.string,
    buttons: PropTypes.array
  }

  componentWillMount() {
    this.id = this.props.id ? this.props.id : "trumbo-" + (new Date().getTime())
    this.initialHTML = this.props.html
    this.props.onChange(this.props.html) // initialize newText
  }

  render() {
  let buttons = this.props.buttons ? this.props.buttons : TRUMBO_BUTTONS 
  return(
    <Contexts.CMS.Consumer>
      { cms => cms.modules &&
        <cms.modules.Trumbowyg 
                   id={this.id}
                   buttons={buttons}
                   data={this.initialHTML}
                   shouldInjectSvgIcons={false}
                   svgIconsPath="/node_modules/trumbowyg/dist/ui/icons.svg"
                   onChange={e => this.props.onChange(e.target.innerHTML)}
                   disabled={this.props.disabled}
                   tabToIndent={true}
                   plugins={{
                    // Add parameters to uploadImage plugin
                    uploadImage: {
                        serverPath: `/api/unit/${this.props.unit}/uploadEditorImg?username=${cms.username}&token=${cms.token}&context=${this.props.imageContext}`,
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
    </Contexts.CMS.Consumer>
  )}
}
