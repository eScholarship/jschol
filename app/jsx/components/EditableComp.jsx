// ##### Wrapper Component for Editables ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Subscriber } from 'react-broadcast'
import ModalComp from '../components/ModalComp.jsx'

export default class EditableComp extends React.Component
{
  static propTypes = {
    widgetName: PropTypes.string.isRequired,
    children: PropTypes.element.isRequired,
    html: PropTypes.string.isRequired,
    onSave: PropTypes.func.isRequired,
    canDelete: PropTypes.bool // optional
  }

  state = { isEditingComp: false, workingMsg: null }

  render = () =>
    <Subscriber channel="cms">
      { cms => {

        // Step 1: If not editing page, pass through to the children, unmodified.
        if (!cms.isEditingPage)
          return this.props.children

        // Step 2: Page is being edited, but component not yet being edited (nor saved)
        else if (!this.state.isEditingComp && !this.state.workingMsg)
          return this.renderWithButtons(cms)

        // Step 3: Edit button has been clicked - display the wysiwyg editor
        else if (this.state.isEditingComp)
          return this.renderEditor(cms)

        // Step 4: Save has been clicked. Display the saving message while we work.
        else
          return this.renderWorkingMsg()
      } }
    </Subscriber>

  renderWithButtons = cms =>
    <div style={{position: "relative"}}>
      { this.props.children }
      <div className="c-editable__edit-buttons">
        <button className="c-editable__edit-button"
                onClick={e=>this.setState({ isEditingComp: true })}>
          Edit
        </button>
        { this.props.canDelete &&
          <button className="c-editable__delete-button">Delete</button> }
      </div>
    </div>

  renderEditor = cms =>
    <div>
      { this.renderWithButtons(cms) }
      <ModalComp isOpen header={this.props.widgetName}
                 content={this.props.renderEditor()}
                 onCancel={e=>this.setState({isEditingComp:false})}
                 okLabel="Save" onOK={e=>this.onSave()}/>
    </div>

  renderWorkingMsg = () =>
    <div style={{position: "relative"}}>
      { this.props.children }
      <div className="c-editable__working">
        <div className="c-editable__working-text">{this.state.workingMsg}</div>
      </div>
    </div>

  onSave()
  {
    this.setState({ isEditingComp: false, workingMsg: "Updating..." })
    let startTime = new Date()
    this.props.onSave()
    .done(()=> {
      // In case save takes less than half a sec, leave the message on there
      // for long enough to see it.
      setTimeout(()=>this.setState({workingMsg: null}), Math.max(500, new Date() - startTime))
    })
    .fail(()=>{
      // Put up a "Failed" message and leave it there a little while so user can see it.
      this.setState({ workingMsg: "Failed." })
      setTimeout(()=>this.setState({workingMsg: null}), 1000)
    })
  }
}
