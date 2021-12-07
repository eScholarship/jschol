import React, { Component } from 'react'
import PropTypes from 'prop-types'
import trumbowyg from 'trumbowyg'
const trumbowygIconsId = 'trumbowyg-icons'

// Load some standard plugins
import 'trumbowyg/plugins/cleanpaste/trumbowyg.cleanpaste.js'
import 'trumbowyg/dist/plugins/table/trumbowyg.table.min.js'

// MH CDL: Load our customized plugins
import './trumbowyg.uploadImage.jsx'
import './trumbowyg.uploadFile.jsx'
import './trumbowyg.fancyCreateLink.jsx'
import './trumbowyg.fancyRemoveFormat.jsx'

class Trumbowyg extends Component {
  constructor(props) {
    super(props)
  }

  componentWillMount() {

  }

  componentDidMount() {

    const {
      id,
      buttons,
      buttonsDef,
      semantic,
      resetCss,
      removeformatPasted,
      autogrow,
      data,
      disabled,
      onFocus,
      onBlur,
      onInit,
      onChange,
      onResize,
      onPaste,
      onOpenFullScreen,
      onCloseFullScreen,
      onClose,
      plugins,
      shouldUseSvgIcons,
      shouldInjectSvgIcons,
      svgIconsPath,
      tabToIndent
    } = this.props

    if (shouldInjectSvgIcons && $(`#${trumbowygIconsId}`).length === 0) {
      $('body').prepend(`<div id="${trumbowygIconsId}">${svgIcons}</div>`)
    }

    const trumbowygInstance = $(`#${id}`)
      .trumbowyg({
        btnsDef: buttonsDef,
        btns: buttons,
        semantic: semantic,
        resetCss: resetCss,
        removeformatPasted: removeformatPasted,
        autogrow: autogrow,
        tabToIndent: tabToIndent,
        svgPath: shouldUseSvgIcons
          ? shouldInjectSvgIcons ? '' : svgIconsPath
          : false,
        plugins: plugins // MH CDL: need to pass plugin parameters
      })

    if (onFocus) {
      trumbowygInstance.on('tbwfocus', onFocus)
    }

    if (onBlur) {
      trumbowygInstance.on('tbwblur', onBlur)
    }

    if (onInit) {
      trumbowygInstance.on('tbwinit', onInit)
    }

    if (onChange) {
      trumbowygInstance.on('tbwchange', onChange)
    }
   
    if (onResize) {
      trumbowygInstance.on('tbwresize', onResize)
    }

    if (onPaste) {
      trumbowygInstance.on('tbwpaste', onPaste)
    }

    if (onOpenFullScreen) {
      trumbowygInstance.on('tbwopenfullscreen', onOpenFullScreen)
    }

    if (onCloseFullScreen) {
      trumbowygInstance.on('tbwclosefullscreen', onCloseFullScreen)
    }

    if (onClose) {
      trumbowygInstance.on('tbwclose', onClose)
    }

    $(`#${id}`).trumbowyg('html', data)
    $(`#${id}`).trumbowyg(disabled === true ? 'disable' : 'enable')
  }

  componentWillReceiveProps(nextProps) {
  }

  shouldComponentUpdate(nextProps, nextState) {

    return nextProps.data !== this.props.data
      || nextProps.disabled !== this.props.disabled
  }

  componentWillUpdate(nextProps, nextState) {

  }

  componentDidUpdate(prevProps, prevState) {
    $(`#${this.props.id}`).trumbowyg('html', this.props.data)
    $(`#${this.props.id}`).trumbowyg(this.props.disabled === true ? 'disable' : 'enable')
  }

  componentWillUnmount() {
    $(`#${this.props.id}`).trumbowyg('destroy')
  }

  render() {
    return (
      <div id={`${this.props.id}`} placeholder={this.props.placeholder}></div>
    )
  }
}

Trumbowyg.defaultProps = {
  buttons: [
    ['viewHTML'],
    ['undo', 'redo'], // Only supported in Blink browsers
    ['formatting'],
    ['strong', 'em', 'del'],
    ['superscript', 'subscript'],
    ['link'],
    ['insertImage'],
    ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
    ['unorderedList', 'orderedList'],
    ['horizontalRule'],
    ['removeformat'],
    ['fullscreen']
  ],
  semantic: true,
  resetCss: false,
  removeformatPasted: false,
  autogrow: false,
  disabled: false,

  shouldUseSvgIcons: true,
  shouldInjectSvgIcons: true
}

Trumbowyg.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  buttons: PropTypes.array,
  semantic: PropTypes.bool,
  resetCss: PropTypes.bool,
  removeformatPasted: PropTypes.bool,
  autogrow: PropTypes.bool,
  disabled: PropTypes.bool,
  plugins: PropTypes.object,

  //event handlers
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onInit: PropTypes.func,
  onChange: PropTypes.func,
  onResize: PropTypes.func,
  onPaste: PropTypes.func,
  onOpenFullScreen: PropTypes.func,
  onCloseFullScreen: PropTypes.func,
  onClose: PropTypes.func,

  shouldUseSvgIcons: PropTypes.bool.isRequired,
  svgIconsPath: PropTypes.string,
  shouldInjectSvgIcons: PropTypes.bool.isRequired
}

export default Trumbowyg
