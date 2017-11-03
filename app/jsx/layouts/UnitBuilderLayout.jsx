import React from 'react'
import PropTypes from 'prop-types'
import Form from 'react-router-form'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

export default class UnitBuilderLayout extends React.Component
{
  static propTypes = {
    sendApiData: PropTypes.func.isRequired,
  }

  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                Unit Builder
              </h1>
            </header>
            <Form to={`/api/unit/${this.props.unit.id}/unitBuilder`}
                  onSubmit={ (event, data) => {
                    event.preventDefault()
                    this.props.sendApiData("PUT", event.target.action, data)
                  }}>
              <p><i>Make sure you are accessing this page from the desired parent unit.</i></p>

              <label className="c-editable-page__label" htmlFor="newUnitID">Unit URL: </label>
              <p>Must consist of lower-case numbers/letters or underscores only. No spaces.</p>
              <input className="c-editable-page__input" id="newUnitID" name="newUnitID" type="text"/>

              <label className="c-editable-page__label" htmlFor="name">Name: </label>
              <input className="c-editable-page__input" id="name" name="name" type="text"/>

              <label className="c-editable-page__label" htmlFor="type">Unit type: </label>
              <select name="type">
                <option value="oru">ORU</option>
                <option value="journal">Journal</option>
              </select>

              <br/><br/>
              <label className="c-editable-page__label" htmlFor="hidden">Hidden: </label>
              <input type="checkbox" id="hidden" name="hidden" defaultChecked={true} />

              <br/><br/>
              <p><i>Important:</i> before selecting 'Create Unit' below, ensure that this unit
                 has been added to both:</p>
              <ul>
                <li>pub-eschol-xtf/style/textIndexer/mapping/allStruct.xml</li>
                <li>pub-eschol-xtf/style/textIndexer/mapping/allStruct-eschol5.xml</li>
              </ul>
              <button type="submit">Create Unit</button>
            </Form>
          </section>
        </main>
      </div>
    )
  }
}
