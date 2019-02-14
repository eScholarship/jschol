import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'

class EditableSidebarContentComp extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      id: PropTypes.number.isRequired,
      kind: PropTypes.string.isRequired,
      attrs: PropTypes.object.isRequired
    })
  }

  state = { newData: this.props.data }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps))
      this.setState({ newData: nextProps.data })
  }

  onSave = () => this.props.sendApiData('PUT',
                   `/api/unit/${this.props.unit.id}/sidebar/${this.props.data.id}`, this.state.newData)

  onDelete = () => this.props.sendApiData('DELETE',
                     `/api/unit/${this.props.unit.id}/sidebar/${this.props.data.id}`, {})

  setData = (newStuff) => {
    this.setState({newData: _.merge(_.cloneDeep(this.state.newData), newStuff)})
  }

  render() {
    let data = this.props.data
    let dataIsSame = _.isEqual(data, this.state.newData)
    return (
      <div>
        { (data.kind == "Text") &&
          <div>
            <label className="c-editable-page__label" htmlFor="title">Title</label>
            <input className="c-editable-page__input" id="title" type="text" defaultValue={data.attrs.title}
                   onChange={ event => this.setData({ attrs: { title: event.target.value } }) }/>

            <label className="c-editable-page__label" htmlFor="text">Text</label>
            <WysiwygEditorComp id="text" html={data.attrs.html} unit={this.props.unit.id} imageContext="sidebar"
              onChange={ newText => this.setData({ attrs: { html: newText }}) }/>
          </div>
        }
        { (data.kind == "TwitterFeed") &&
          <div>
            <label className="c-editable-page__label" htmlFor="title">Title</label>
            <input className="c-editable-page__input" id="title" type="text" defaultValue={data.attrs.title}
                   onChange={ event => this.setData({ attrs: { title: event.target.value } }) }/>

            <label className="c-editable-page__label" htmlFor="twitter_handle">Twitter Handle</label>
            <p>The portion of your Twitter page's URL that appears after: http://www.twitter.com/_____</p>
            <input className="c-editable-page__input" id="twitter_handle" type="text" defaultValue={data.attrs.twitter_handle}
                   onChange={ event => this.setData({ attrs: { twitter_handle: event.target.value } }) }/>
          </div>
        }

        <p>
          <button className="c-editable-page__button" onClick={this.onSave} disabled={dataIsSame}>Save</button>
          <button className="c-editable-page__button" onClick={this.onDelete}>Delete</button>
        </p>
      </div>
    )
  }
}

export default class UnitSidebarConfigLayout extends React.Component
{
  static propTypes = {
    sendApiData: PropTypes.func.isRequired,
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired
    }).isRequired,
    data: PropTypes.shape({
      id: PropTypes.number.isRequired,
      kind: PropTypes.string.isRequired,
      attrs: PropTypes.object.isRequired
    })
  }

  render() {
    let p = this.props
    let title = (p.data.kind == "Text" && p.data.attrs.title) ? p.data.attrs.title : p.data.kind.replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
    let kindStr = p.data.kind == "Text" ? "text widget" : "built-in widget"
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                { `${title} (${kindStr})` }
              </h1>
            </header>
            <EditableSidebarContentComp unit={p.unit} data={p.data} sendApiData={p.sendApiData}/>
          </section>
        </main>
      </div>
    )
  }
}
