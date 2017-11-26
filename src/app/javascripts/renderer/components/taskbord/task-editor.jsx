import React from 'react';
import { Editor, Raw, Data } from 'slate'
import _ from 'lodash';
import CheckListItem from './check-lists'
import * as Constants from '../constants'
import * as TaskEditorUtil from '../../../utils/task-editor'

const TaskEditor = class TaskEditor extends React.Component {

  /**
   * Get the schema.
   *
   * @return {Object} nodes
   */

  getSchema(){
    return {
      nodes: {
        'block-quote': props => <blockquote>{props.children}</blockquote>,
        'bulleted-list': props => <ul className="list-style-disc">{props.children}</ul>,
        'numbered-list': props => <ol className="list-style-decimal">{props.children}</ol>,
        'heading-one': props => <h1>{props.children}</h1>,
        'heading-two': props => <h2>{props.children}</h2>,
        'heading-three': props => <h3>{props.children}</h3>,
        'list-item': props => <li className={'indent' + props.node.data.get('indent')}>{props.children}</li>,
        'check-list-item': CheckListItem,
        'separator' : props => <div className="separator-line" contentEditable={false}><span className="separator"><span></span></span></div>
      }
    }
  }

  /**
   * get sliced chars list
   *
   * @param  {String} chars
   * @return {Array}
   */

  getSlicedCharsList(chars) {
    let slicedCharsList = []
    _.each(_.range(1, 4), (end, i) => {
      slicedCharsList.push(chars.slice(0, end))
    })
    return slicedCharsList
  }

  /**
   * Get the block type for a series of auto-markdown shortcut `chars`.
   *
   * @param {String} chars
   * @return {String} block
   */

  getType(chars){
    let slicedCharsList = this.getSlicedCharsList(chars)
    switch (true) {
      case /---/.test(slicedCharsList[2]): return 'separator'
      case /\[\]/.test(slicedCharsList[1]): return 'check-list-item'
      case /\[X\]/.test(slicedCharsList[2]): return 'checked-list-item'
      case /\*/.test(slicedCharsList[0]):
      case /-/.test(slicedCharsList[0]):
      case /\+/.test(slicedCharsList[0]): return 'list-item'
      case />/.test(slicedCharsList[0]): return 'block-quote'
      case /###/.test(slicedCharsList[2]): return 'heading-three'
      case /##/.test(slicedCharsList[1]): return 'heading-two'
      case /#/.test(slicedCharsList[0]): return 'heading-one'
      default: return null
    }
  }

  renderToolbar(){
    return (
      <div className="menu toolbar-menu">
        {this.renderBlockButton('check-list-item', 'check_box')}
        {this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
        {this.renderBlockButton('numbered-list', 'format_list_numbered')}
        {this.renderBlockButton('block-quote', 'format_quote')}
        {this.renderBlockButton('heading-one', 'looks_one')}
        {this.renderBlockButton('heading-two', 'looks_two')}
        {this.renderBlockButton('heading-three', 'looks_3')}
      </div>
    )
  }

  renderBlockButton(type, icon){
    let isActive
    if (type == 'bulleted-list' || type == 'numbered-list') {
      const state = this.props.taskList
      isActive = state.blocks.some((block) => {
        return !!state.document.getClosest(block.key, parent => parent.type == type)
      })

    } else {
      isActive = this.hasBlock(type)
    }

    const onMouseDown = e => this.onClickBlock(e, type)
    return (
      <span className="button" onMouseDown={onMouseDown} data-active={isActive}>
        <span className="material-icons">{icon}</span>
      </span>
    )
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
        {this.renderToolbar()}
        <Editor
          className={"ace-line"}
          placeholder={"Time is an illusion..."}
          schema={this.getSchema()}
          state={this.props.taskList}
          onChange={this.onChange.bind(this)}
          onKeyDown={this.onKeyDown.bind(this)}
          ref='editor'
        />
      </div>
    )
  }

  /**
   * Check if the any of the currently selected blocks are of `type`.
   *
   * @param  {String}  type
   * @return {Boolean}
   */

  hasBlock(type) {
    const state = this.props.taskList
    return state.blocks.some(node => node.type == type)
  }

  // On change, update the app's React state with the new editor state.
  onChange(state){
    this.props.onUpdateTask(state);
  }

  /**
   * When a block button is clicked, toggle the block type.
   * @param  {Event} e
   * @param  {String} type
   */

  onClickBlock(e, type){
    e.preventDefault()
    const state = this.props.taskList
    let transform = state.transform()

    if (type != 'bulleted-list' && type != 'numbered-list') {

      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')

      } else {
        transform = transform.setBlock(isActive ? Constants.default_node : type)
      }

    } else {
      const isList = this.hasBlock('list-item')
      const isType = state.blocks.some((block) => {
        return !!state.document.getClosest(block.key, parent => parent.type == type)
      })

      if (isList && isType) {
        transform = transform
          .setBlock(Constants.default_node)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')

      } else if (isList) {
        transform = transform
          .unwrapBlock(type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list')
          .wrapBlock(type)

      } else {
        transform = transform
          .setBlock('list-item')
          .wrapBlock(type)

      }
    }

    this.onChange(transform.apply())
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
      case 'tab': return this.onTab(e, data.isShift, state)
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
    let chars = startBlock.text.slice(0, startOffset)
    if (chars.length > 5) return
    chars = chars.replace(/\s*/g, '')
    let type = this.getType(chars)

    if (!type) return
    if (type == 'list-item' && startBlock.type == 'list-item') return
    e.preventDefault()

    let time = 60
    if (type == 'check-list-item'){
      let inputTime = chars.match(/\d{1,3}/)
      if (inputTime !== null) time = Number(inputTime[0])
    }

    let data = Data.create({
      requiredTime: time,
      done: type == 'checked-list-item',
      indent: Constants.minIndent
    })

    if ( ! startBlock.data.has("positionTop")) {
      data = data.set("positionTop", this.props.nextTaskPositionTop)
    } else {
      data = data.set("positionTop", startBlock.data.get("positionTop"))
    }
    data = data.set('isCurrent', TaskEditorUtil.isCurrentTask(startBlock, data.get('positionTop'), time))

    type = type == 'checked-list-item' ? 'check-list-item' : type
    let transform = state
      .transform()
      .setBlock(type)
      .setBlock({ data: data })

    if (type == 'list-item') transform.wrapBlock('bulleted-list')

    state.document.getClosest(startBlock.key, (parent) => {
      if(parent.type == 'bulleted-list' && type !== 'list-item') {
        transform = transform.unwrapBlock('bulleted-list')
      } else if (parent.type == 'numbered-list' && type !== 'list-item') {
        transform = transform.unwrapBlock('numbered-list')
      }
    })

    if (type == 'separator') {
      state =  transform
        .splitBlock()
        .setBlock('paragraph')
        .apply()
    } else {
      state = transform
        .extendToStartOf(startBlock)
        .delete()
        .apply()
    }
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

    if (startBlock.type == 'paragraph') {
      let previousBlock = state.document.getPreviousBlock(state.startBlock)
      if (previousBlock !== null && previousBlock.type == 'separator') {
        let transform = state
          .transform()
          .removeNodeByKey(previousBlock.key)
        return transform.apply()
      }
      return
    }
    e.preventDefault()

    let transform = state
      .transform()
      .setBlock('paragraph')

    if (startBlock.type == 'list-item') {
      transform.unwrapBlock('bulleted-list')
      transform.unwrapBlock('numbered-list')
    }

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
      startBlock.type != 'check-list-item' &&
      startBlock.type != 'block-quote'
    ) {
      return
    }
    e.preventDefault()
    return state
      .transform()
      .splitBlock()
      .setBlock(startBlock.type)
      .setBlock({
        data: Data.create({
          positionTop: this.props.nextTaskPositionTop,
          requiredTime: startBlock.data.get("requiredTime"),
          isCurrent: TaskEditorUtil.isCurrentTask(
            startBlock,
            this.props.nextTaskPositionTop,
            startBlock.data.get('requiredTime')
          ),
          indent: startBlock.data.get("indent"),
          done: false
        })
      })
      .apply()
  }

  /**
   * On tab, if block type is list-item,
   * create indented block.
   *
   * @param {Event} e
   * @param {Boolean} isSift
   * @param {State} state
   * @return {State or Null} state
   */

  onTab(e, isShift, state){
    e.preventDefault()
    let type = state.startBlock.type
    if (/list-item/.test(type)) {
      let indent = state.startBlock.data.get('indent')
      state = state
        .transform()
        .setBlock({
          data: state.startBlock.data.set('indent', TaskEditorUtil.getIndent(indent, isShift))
        })
        .apply()
    }

    return state
  }

  componentDidMount() {
    this.props.onUpdateTask(this.props.focusLastBlock())
  }
}

module.exports = TaskEditor;
