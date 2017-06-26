import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'
import EditableComp from '../components/EditableComp.jsx'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'

class EditableNavContentComp extends React.Component
{
  static propTypes = {
    cms: PropTypes.object.isRequired,
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

  onSave = () =>
    $.getJSON({ url: `/api/unit/${this.props.unit.id}/nav/${this.props.data.id}`,
                type: 'PUT',
                data: Object.assign(this.state.newData,
                        { username: this.props.cms.username, token: this.props.cms.token })
              })
    .done((data)=>{
      this.props.cms.fetchPageData()  // re-fetch page state after DB is updated
    })
    .fail((data)=>{
      alert("Save failed" + (data.responseJSON ? ":\n"+data.responseJSON.message : "."))
      this.props.cms.fetchPageData()  // re-fetch page state after DB is updated
    })

  onDelete = () =>
    $.ajax({ url: `/api/unit/${this.props.unit.id}/nav/${this.props.data.id}`,
            type: 'DELETE',
            data: { username: this.props.cms.username, token: this.props.cms.token }
          })
    .done(()=>{
      this.props.cms.goLocation(`/uc/${this.props.unit.id}`)
    })
    .fail((data)=>{
      alert("Delete failed" + (data.responseJSON ? ":\n"+data.responseJSON.message : "."))
      this.props.cms.fetchPageData()  // re-fetch page state after DB is updated
    })

  setData = (newStuff) => {
    this.setState({newData: Object.assign(_.cloneDeep(this.state.newData), newStuff)})
  }

  render() {
    let data = this.props.data
    let dataIsSame = _.isEqual(data, this.state.newData)
    return (
      <div>
        { (data.type == "page") && [
          <label className="c-editable-page__label" htmlFor="slug">Slug</label>,
          <input className="c-editable-page__input" id="slug" type="text" defaultValue={data.slug}
                 onChange={ event => this.setData({ slug: event.target.value }) }/>]
        }

        <label className="c-editable-page__label" htmlFor="name">Name</label>
        <input className="c-editable-page__input" id="name" type="text" defaultValue={data.name}
               onChange={ event => this.setData({ name: event.target.value }) }/>

        { (data.type == "page") && [
          <label className="c-editable-page__label" htmlFor="title">Title</label>,
          <input className="c-editable-page__input" id="title" type="text" defaultValue={data.title}
                 onChange={ event => this.setData({ title: event.target.value }) }/>,
          <label className="c-editable-page__label" htmlFor="text">Text</label>,
          <WysiwygEditorComp id="text" html={data.attrs.html}
            onChange={ newText => this.setData({ attrs: { html: newText }}) }/>]
        }

        { (data.type == "link") && [
          <label className="c-editable-page__label" htmlFor="url">URL</label>,
          <input className="c-editable-page__input" id="url" type="text" defaultValue={data.url}
                 onChange={ event => this.setData({ url: event.target.value }) }/>]
        }

        <p>
          <button className="c-editable-page__button" onClick={this.onSave} disabled={dataIsSame}>Save</button>
          <button className="c-editable-page__button" onClick={this.onDelete}>Delete</button>
        </p>
      </div>
    )
  }
}

export default class UnitNavConfigLayout extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  }

  render() {
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                {
                  this.props.data.title ? this.props.data.title :
                  this.props.data.name + " (" + this.props.data.type + ")"
                }
              </h1>
            </header>
            <Subscriber channel="cms">
              { cms =>
                cms.isEditingPage
                ? <EditableNavContentComp cms={cms} unit={this.props.unit} data={this.props.data}/>
                : <div>TODO: redirect to page</div>
              }
            </Subscriber>
          </section>
        </main>
      </div>
    )
  }
}
