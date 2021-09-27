import React from 'react'
import PropTypes from 'prop-types'
import FormComp from '../components/FormComp.jsx'
import { Link } from 'react-router-dom'
import Contexts from '../contexts.jsx'

const UNIT_TYPE_TO_LABEL = { series: "paper series",
                             monograph_series: "monograph series",
                             oru: "ORU",
                             journal: "journal" }

class SortableUnitList extends React.Component {
  state = this.setupState(this.props)

  setupState(props) {
    return {
      data: this.generateData(props.subUnits)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.fetchingData && !_.isEqual(this.props, nextProps))
      this.setState(this.setupState(nextProps))
  }

  generateData(subUnits) {
    if (!subUnits)
      return undefined
    return subUnits.map(unit => { return {
      id: unit.id,
      title: <Link to={`/uc/${unit.id}`}>{unit.name}</Link>,
      subtitle: <span>{unit.id} <i>({UNIT_TYPE_TO_LABEL[unit.type]})</i></span> }})
  }

  travOrder(treeData) {
    return treeData.map(item => item.id)
  }

  render() {
    const SortableTree = this.props.cms.modules.SortableTree
    return (
      <SortableTree
        treeData={this.state.data}
        isVirtualized={false}
        maxDepth={1}
        onChange={treeData => this.setState({ data: treeData })}
        onMoveNode={()=>this.props.onChangeOrder(this.travOrder(this.state.data))}/>
    )
  }
}

export default class UnitBuilderLayout extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      sub_units: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      }))
    }).isRequired,
    sendApiData: PropTypes.func.isRequired,
  }

  reorderUnits = (newOrder) => {
    this.props.sendApiData('PUT', `/api/unit/${this.props.unit.id}/unitOrder`, { order: JSON.stringify(newOrder) })
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

            {p.data.sub_units.length > 0 &&
              <details className="c-togglecontent" open>
                <summary>Arrange sub-units</summary>
                <Contexts.CMS.Consumer>
                  { cms => cms && cms.modules &&
                    <SortableUnitList cms={cms}
                                      unit={p.unit.id}
                                      subUnits={p.data.sub_units}
                                      onChangeOrder={this.reorderUnits}/>
                  }
                </Contexts.CMS.Consumer>
              </details>
            }

            <details className="c-togglecontent">
              <summary>List parent unit(s)</summary>
              <ul>
                { p.data.parent_units.map(u =>
                    <li key={u.id}><a href={"/uc/" + u.id}>{u.name}</a></li>)
                }
              </ul>
            </details>

            {/oru|campus/.test(p.unit.type) &&
              <details className="c-togglecontent">
                <summary>Add new sub-unit</summary>
                <FormComp onSubmit={ (event, data) => {
                            event.preventDefault()
                            p.sendApiData("PUT", `/api/unit/${p.unit.id}/unitBuilder`, data)
                          }}>
                  <p><i>Make sure you are accessing this page from the desired parent unit.</i></p>

                  <label className="c-editable-page__label" htmlFor="newUnitID">Unit URL: </label>
                  <p>Must consist of lower-case numbers/letters or underscores only. No spaces.</p>
                  <input className="c-editable-page__input" id="newUnitID" name="newUnitID" type="text"/>

                  <label className="c-editable-page__label" htmlFor="name">Name: </label>
                  <input className="c-editable-page__input" id="name" name="name" type="text"/>

                  <label className="c-editable-page__label" htmlFor="type">Unit type: </label>
                  <select name="type">
                    { ["oru", "journal", "series", "monograph_series"].map(unitType =>
                        <option key={unitType} value={unitType}>{UNIT_TYPE_TO_LABEL[unitType]}</option>) }
                  </select>

                  <br/><br/>
                  <label className="c-editable-page__label" htmlFor="hidden">Hidden: </label>
                  <input type="checkbox" id="hidden" name="hidden" defaultChecked={true} />
                  <button type="submit">Create Unit</button>
                </FormComp>
              </details>
            }
            {/oru|campus/.test(p.unit.type) &&
              <details className="c-togglecontent">
                <summary>Adopt existing unit as sub-unit</summary>
                <FormComp onSubmit={ (event, data) => {
                            event.preventDefault()
                            p.sendApiData("PUT", `/api/unit/${p.unit.id}/adoptUnit`, data)
                          }}>
                  <p><i>Make sure you are accessing this page from the desired parent unit.</i></p>

                  <label className="c-editable-page__label" htmlFor="existingUnitID">Existing unit URL to adopt: </label>
                  <input className="c-editable-page__input" id="existingUnitID" name="existingUnitID" type="text"/>

                  <button type="submit">Adopt Unit</button>
                </FormComp>
              </details>
            }
            {/oru|campus/.test(p.unit.type) &&
              <details className="c-togglecontent">
                <summary>Disown sub-unit</summary>
                <FormComp onSubmit={ (event, data) => {
                            event.preventDefault()
                            p.sendApiData("PUT", `/api/unit/${p.unit.id}/disownUnit`, data)
                          }}>

                  <p><i>This option will only work for child units that have at least one other parent, to avoid orphans.
                        You can use Delete Unit for units that only have one parent.</i></p>

                  <label className="c-editable-page__label" htmlFor="existingUnitID">Child unit URL to disown: </label>
                  <input className="c-editable-page__input" id="existingUnitID" name="existingUnitID" type="text"/>

                  <button type="submit">Disown Unit</button>
                </FormComp>
              </details>
            }

            <details className="c-togglecontent">
              <summary>Move this unit</summary>
              <FormComp onSubmit={ (event, data) => {
                          event.preventDefault()
                          p.sendApiData("PUT", `/api/unit/${p.unit.id}/moveUnit`, data)
                        }}>
                <label className="c-editable-page__label" htmlFor="targetUnitID">Destination parent unit: </label>
                <input className="c-editable-page__input" id="targetUnitID" name="targetUnitID" type="text"/>
                <button type="submit">Move Unit '{p.unit.id}'</button>
              </FormComp>
            </details>

            <details className="c-togglecontent">
              <summary>Copy unit content</summary>
              <FormComp onSubmit={ (event, data) => {
                          event.preventDefault()
                          p.sendApiData("PUT", `/api/unit/${p.unit.id}/copyUnit`, data)
                        }}>
                <label className="c-editable-page__label" htmlFor="targetParentID">Destination parent unit: </label>
                <input className="c-editable-page__input" id="targetParentID" name="targetParentID" type="text"/>
                <label className="c-editable-page__label" htmlFor="newUnitID">Name for copied unit: </label>
                <input className="c-editable-page__input" id="newUnitID" name="newUnitID" type="text"/>
                <button type="submit">Copy unit '{p.unit.id}'</button>
              </FormComp>
            </details>

            <details className="c-togglecontent">
              <summary>Delete this unit</summary>
              <FormComp onSubmit={ (event, data) => {
                          event.preventDefault()
                          p.sendApiData("PUT", `/api/unit/${p.unit.id}/deleteUnit`, data)
                        }}>
                <p><i>Note:</i> This will fail (harmlessly) if the unit has any items or sub-units.</p>
                <button type="submit" className="o-button__3">Delete unit '{p.unit.id}'</button>
              </FormComp>
            </details>
          </section>
        </main>
      </div>
    )
  }
}
