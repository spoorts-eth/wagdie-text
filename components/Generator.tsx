import Aesthetically from 'aesthetically'
import isHotKey from 'is-hotkey'
import React, {
  ClipboardEventHandler,
  KeyboardEventHandler,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createEditor, Descendant, Editor, Text, Transforms } from 'slate'
import {
  Slate,
  Editable,
  withReact,
  RenderLeafProps,
  ReactEditor,
} from 'slate-react'

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

const CustomEditor = {
  generateText(text: string, bold = false, style = 'fraktur') {
    return Aesthetically.format(text, bold ? 'fraktur-bold' : 'fraktur')
  },
  isBoldMarkActive(editor: ReactEditor) {
    console.log(Editor.marks(editor));
    const [match] = Editor.nodes(editor, {
      match: (node) => {
        if ('bold' in node) {
          return node.bold ?? false
        }
        return false
      },
      universal: true,
    })

    return !!match
  },

  toggleBoldMark(editor: ReactEditor) {
    const isBold = CustomEditor.isBoldMarkActive(editor)
    if (isBold) {
      Editor.removeMark(editor, 'bold')
    } else {
      Editor.addMark(editor, 'bold', true)
    }
    if (editor.selection?.anchor) {
      const currentSelection = {...editor.selection};
      const text = Aesthetically.unformat(
        Editor.string(editor, editor.selection)
      )
      if (text.length) {
        Transforms.insertText(editor, this.generateText(text, !isBold), {})
        // todo work out how to keep this
        Transforms.setSelection(editor, currentSelection)
      }
    }
  },
}

export default function Generator() {
  const [editor] = useState(() => withReact(createEditor()))

  const generateText = useCallback((text: string, bold = false) => {
    return CustomEditor.generateText(text, bold)
  }, [])

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      const isBold = CustomEditor.isBoldMarkActive(editor)
      if (isHotKey('mod+b', event)) {
        event.preventDefault()
        CustomEditor.toggleBoldMark(editor)
        return
      }
      if (event.metaKey) return
      if (/^[a-zA-Z\!\?]$/.test(event.key)) {
        event.preventDefault()
        editor.insertText(generateText(event.key, isBold))
      }
    },
    [editor, generateText]
  )

  const onPaste: ClipboardEventHandler = useCallback(
    (event) => {
      const { clipboardData } = event
      event.preventDefault()
      const text = clipboardData.getData('text/plain')
      const isBold = CustomEditor.isBoldMarkActive(editor)
      editor.insertText(generateText(text, isBold))
    },
    [editor, generateText]
  )

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />
  }, [])

  const renderPlaceholder = useCallback(() => {
    return <div>Type your shit</div>
  }, [])

  return (
    <Slate editor={editor} value={initialValue}>
      <Editable
        // renderLeaf={renderLeaf}
        placeholder="Type something"
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
    </Slate>
  )
}

const Leaf = (props: RenderLeafProps) => {
  const Tag = props.leaf.bold ? 'strong' : 'span'

  return (
    <>
      <Tag {...props.attributes}>{props.children}</Tag>
    </>
  )
}
