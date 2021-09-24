import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'
import Contexts from '../contexts.jsx'

class EditableNavContentComp extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  }

  state = { newData: this.props.data }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps))
      this.setState({ newData: nextProps.data })
  }

  onSave = () => this.props.sendApiData('PUT',
                   `/api/unit/${this.props.unit.id}/nav/${this.props.data.id}`, this.state.newData)

  onDelete = () => this.props.sendApiData('DELETE',
                     `/api/unit/${this.props.unit.id}/nav/${this.props.data.id}`, {})

  setData = (newStuff) => {
    this.setState({newData: Object.assign(_.cloneDeep(this.state.newData), newStuff)})
  }

  render() {
    let data = this.props.data
    let dataIsSame = _.isEqual(data, this.state.newData)
    return (
      <Contexts.CMS.Consumer>
        { cms => {
          let navPerms = (cms.permissions && cms.permissions.nav_perms[data.slug]) || {}
          return (
          <div>
            { (data.type == "page") &&
              <div>
                <label className="c-editable-page__label" htmlFor="slug">
                  Page URL{!navPerms.change_slug && " (restricted)"}
                </label>
                { cms.permissions && cms.permissions.super &&
                  <p>Must consist of numbers and/or letters only. No spaces.</p> }
                <input disabled={!navPerms.change_slug} className="c-editable-page__input"
                       id="slug" type="text" defaultValue={data.slug}
                       onChange={ event => this.setData({ slug: event.target.value }) }/>
              </div>
            }

            <label className="c-editable-page__label" htmlFor="name">Navigation Bar Label</label>
            <p>For optimal display, use fewer than 25 characters</p>
            <input className="c-editable-page__input" id="name" type="text" defaultValue={data.name}
                   onChange={ event => this.setData({ name: event.target.value }) }/>

            { (data.type == "page") &&
              <div>
                {navPerms.remove ?
                  <div>
                    <label htmlFor="hidden">Hidden (select checkbox to omit this from the navigation bar)</label>
                    <input className="c-editable-page__input" type="checkbox" id="hidden" name="hidden" defaultChecked={data.hidden}
                           onChange={ event => this.setData({ hidden: event.target.checked }) }/>
                  </div>
                  :
                  <div>
                    <div className="c-editable-page__label">Hidden (restricted)</div>
                    <span>{`Page is ${data.hidden ? "" : "not "}hidden.`}</span>
                  </div>
                }
                <br/>
                <label className="c-editable-page__label" htmlFor="title">Page Title</label>
                <p>Generally the same as Navigation Bar Label, but in some cases longer and more descriptive.</p>
                <input className="c-editable-page__input" id="title" type="text" defaultValue={data.title}
                       onChange={ event => this.setData({ title: event.target.value }) }/>
                <label className="c-editable-page__label" htmlFor="text">
                  Text{!navPerms.change_text && " (restricted)"}
                </label>
                <WysiwygEditorComp id="text" html={data.attrs.html} unit={this.props.unit.id} imageContext="content"
                  disabled={!navPerms.change_text}
                  onChange={ newText => this.setData({ attrs: { html: newText }}) }/>
              </div>
            }

            { (data.type == "link") &&
              <div>
                <label className="c-editable-page__label" htmlFor="url">External Link URL</label>
                <input className="c-editable-page__input" id="url" type="text" defaultValue={data.url}
                       onChange={ event => this.setData({ url: event.target.value }) }/>
              </div>
            }

            <p>
              <button className="c-editable-page__button" onClick={this.onSave} disabled={dataIsSame}>Save</button>
              <button className="c-editable-page__button" onClick={this.onDelete}>Delete</button>
            </p>
          </div>
          ) }
        }
      </Contexts.CMS.Consumer>
    )
  }
}

export default class UnitNavConfigLayout extends React.Component
{
  static propTypes = {
    sendApiData: PropTypes.func.isRequired,
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired
    }).isRequired,
    data: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  }

  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                {
                  p.data.title ? p.data.title :
                  p.data.name + " (" + p.data.type + ")"
                }
              </h1>
            </header>
            <EditableNavContentComp unit={p.unit} data={p.data} sendApiData={p.sendApiData}/>
          </section>
        </main>
      </div>
    )
  }
}
