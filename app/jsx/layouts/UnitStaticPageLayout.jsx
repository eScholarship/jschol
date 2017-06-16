import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'
import EditableComp from '../components/EditableComp.jsx'

class EditableMainContentComp extends React.Component
{
  static propTypes = {
    onSave: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    html: PropTypes.string.isRequired
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
    title: PropTypes.string.isRequired,
    html: PropTypes.string.isRequired
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


class UnitStaticPageLayout extends React.Component {
  onSaveContent(newText, cms) {
    return $
      .ajax({ url: `/api/unit/${this.props.unit.id}/${this.props.data.slug}`,
            type: 'PUT', data: { username: cms.username, token: cms.token, newText: newText }})
      .done(()=>{
        this.props.fetchPageData()  // re-fetch page state after DB is updated
      })
  }

  render() {
    var data = this.props.data;
    return (
      <div className="c-columns">
        <main id="maincontent">
          <Subscriber channel="cms">
            { cms =>
              <EditableMainContentComp onSave={(newText)=>this.onSaveContent(newText, cms)}
                html={data.attrs.html} title={data.title}/>
            }
          </Subscriber>
        </main>
        <aside>
          {this.props.sidebar}
        </aside>
      </div>
    )
  }
}

module.exports = UnitStaticPageLayout