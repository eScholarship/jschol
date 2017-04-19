// ##### Sidebar Text Widget Component ##### //

import React from 'react'
import EditableComp from './EditableComp.jsx'
import WysiwygEditorComp from './WysiwygEditorComp.jsx'

export default class EditableMainContentComp extends React.Component
{
  static propTypes = {
    onSave: React.PropTypes.func.isRequired,
    title: React.PropTypes.string.isRequired,
    html: React.PropTypes.string.isRequired
  }

  state = { newText: null }

  render() { let p = this.props; return(
    <EditableComp canDelete widgetName="Main content"
                  title={p.title} html={p.html}
                  renderEditor={this.renderEditor}
                  onSave={() => this.props.onSave(this.state.newText)}>
      <MainContentComp title={p.title} html={p.html}/>
    </EditableComp>
  )}

  renderEditor = () => // properly binds 'this'
    <WysiwygEditorComp html={this.props.html}
                      onChange={(newText) => this.setState({newText: newText})}/>
}

class MainContentComp extends React.Component
{
  static propTypes = {
    title: React.PropTypes.string.isRequired,
    html: React.PropTypes.string.isRequired
  }

  render() { return(
    <section className="o-columnbox1">
      <header>
        <h1 className="o-columnbox1__heading">{this.props.title}</h1>
      </header>
      <div dangerouslySetInnerHTML={{__html: this.props.html}}/>
    </section>
  )}
}
