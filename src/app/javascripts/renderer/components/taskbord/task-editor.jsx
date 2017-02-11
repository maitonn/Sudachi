import React from 'react';
import { Editor, Raw } from 'slate'
// import initialState from './state.json'
import {Data} from 'slate'
import taskListStorage from '../../../modules/task-list-storage';
import moment from 'moment'
import {ipcRenderer} from 'electron'

const initialState = ipcRenderer.sendSync('getTaskList', moment().format("YYYYMMDD"))

const TaskEditor = class TaskEditor extends React.Component {

  /**
   * Deserialize the raw initial state.
   *
   * @type {Object}
   */

  // Set the initial state when the app is first constructed.
  constructor(props){
    super(props);
    this.state = {
      state: Raw.deserialize(initialState, { terse: true }),
      schema: {
        nodes: {
          'block-quote': props => <blockquote>{props.children}</blockquote>,
          'bulleted-list': props => <ul>{props.children}</ul>,
          'heading-one': props => <h1>{props.children}</h1>,
          'heading-two': props => <h2>{props.children}</h2>,
          'heading-three': props => <h3>{props.children}</h3>,
          'heading-four': props => <h4>{props.children}</h4>,
          'heading-five': props => <h5>{props.children}</h5>,
          'heading-six': props => <h6>{props.children}</h6>,
          'list-item': props => <li>{props.children}</li>,
          'task-list-done' : props => <ul className="task-line" onClick={this.onClick.bind(this)}><li className="done"><div>{props.children}</div></li></ul>,
          'task-list' : props => <ul className="task-line" onClick={this.onClick.bind(this)}><li><div>{props.children}</div></li></ul>
        }
      }
    }
    this.storage = new taskListStorage()
  }

  /**
   * Get the block type for a series of auto-markdown shortcut `chars`.
   *
   * @param {String} chars
   * @return {String} block
   */

  getType(chars){
    switch (true) {
      case /\*/.test(chars):
      case /-/.test(chars):
      case /\+/.test(chars): return 'list-item'
      case /\[\]/.test(chars): return 'task-list'
      case /\[X\]/.test(chars): return 'task-list-done'
      case />/.test(chars): return 'block-quote'
      case /#/.test(chars): return 'heading-one'
      case /##/.test(chars): return 'heading-two'
      case /###/.test(chars): return 'heading-three'
      case /####/.test(chars): return 'heading-four'
      case /#####/.test(chars): return 'heading-five'
      case /######/.test(chars): return 'heading-six'
      default: return null
    }
  }

  /**
   *
   * Render the example.
   *
   * @return {Component} component
   */

  render() {
    return (
      <div className="editor">
        <Editor
          schema={this.state.schema}
          state={this.state.state}
          onChange={this.onChange.bind(this)}
          onKeyDown={this.onKeyDown.bind(this)}
        />
      </div>
    )
  }

  // On change, update the app's React state with the new editor state.
  onChange(state){
    this.setState({ state });
    this.props.callbackToTv(state);
    this.storage.set(moment().format("YYYYMMDD"), Raw.serialize(state).document)
  }

  // On click toggle task list status.
  onClick(e){
    let state = this.state.state
    this.props.callbackClicktoTv(state)

    let type = state.startBlock.type == 'task-list' ? 'task-list-done' : 'task-list'
    let transform = state
      .transform()
      .setBlock(type)

    e.preventDefault()
    this.setState({ state: transform.apply() })
  }

  /**
   * On key down, check for our specific key shortcuts.
   *
   * @param {Event} e
   * @param {Data} data
   * @param {State} state
   * @return {State or Null} state
   */

  onKeyDown(e, data, state){
    switch (data.key) {
      case 'space': return this.onSpace(e, state)
      case 'backspace': return this.onBackspace(e, state)
      case 'enter': return this.onEnter(e, state)
    }
  }

  /**
 * On space, if it was after an auto-markdown shortcut, convert the current
 * node into the shortcut's corresponding type.
 *
 * @param {Event} e
 * @param {State} state
 * @return {State or Null} state
 */

  onSpace(e, state) {
    if (state.isExpanded) return
    const { startBlock, startOffset } = state
    const chars = startBlock.text.slice(0, startOffset).replace(/\s*/g, '')
    const type = this.getType(chars)

    if (!type) return
    if (type == 'list-item' && startBlock.type == 'list-item') return
    e.preventDefault()

    let time = 60
    if (type == 'task-list' || type == 'task-list-done'){
      let inputTime = chars.match(/\d{1,3}/)
      if (inputTime !== null) time = Number(inputTime[0])
    }

    let transform = state
      .transform()
      .setBlock(type)
      .setBlock({ data: Data.create({ requiredTime: time }) })

    if (type == 'list-item') transform.wrapBlock('bulleted-list')

    state = transform
      .extendToStartOf(startBlock)
      .delete()
      .apply()

    return state
  }

  /**
   * On backspace, if at the start of a non-paragraph, convert it back into a
   * paragraph node.
   *
   * @param {Event} e
   * @param {State} state
   * @return {State or Null} state
   */

  onBackspace(e, state){
    if (state.isExpanded) return
    if (state.startOffset != 0) return
    const { startBlock } = state

    if (startBlock.type == 'paragraph') return
    e.preventDefault()

    let transform = state
      .transform()
      .setBlock('paragraph')

    if (startBlock.type == 'list-item') transform.unwrapBlock('bulleted-list')

    state = transform.apply()
    return state
  }
  /**
   * On return, if at the end of a node type that should not be extended,
   * create a new paragraph below it.
   *
   * @param {Event} e
   * @param {State} state
   * @return {State or Null} state
   */

  onEnter(e, state){
    if (state.isExpanded) return
    const { startBlock, startOffset, endOffset } = state
    if (startOffset == 0 && startBlock.length == 0) return this.onBackspace(e, state)
    if (endOffset != startBlock.length) return

    if (
      startBlock.type != 'heading-one' &&
      startBlock.type != 'heading-two' &&
      startBlock.type != 'heading-three' &&
      startBlock.type != 'heading-four' &&
      startBlock.type != 'heading-five' &&
      startBlock.type != 'heading-six' &&
      startBlock.type != 'block-quote'
    ) {
      return
    }

    e.preventDefault()
    return state
      .transform()
      .splitBlock()
      .setBlock('paragraph')
      .apply()
  }

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     editorState: RichUtils.toggleBlockType(EditorState.createEmpty(), 'unordered-list-item')
  //   };
  // }
  //
  // componentDidMount() {
  //   this.refs.editor.focus();
  // }
  //
  // onChange(editorState) {
  //   this.setState({editorState});
  //   this.props.callbackToTv(editorState.getCurrentContent());
  // }
  //
  // render() {
  //   const {editorState} = this.state;
  //   return (
  //     <Editor
  //       editorState={editorState}
  //       onChange={this.onChange.bind(this)}
  //       ref="editor"
  //     />
  //   )
  // }
}

module.exports = TaskEditor;
