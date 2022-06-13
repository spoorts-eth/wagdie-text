import Aesthetically from 'aesthetically'
import isHotKey from 'is-hotkey'
import React, {
  ClipboardEventHandler,
  KeyboardEventHandler,
  useCallback,
  useState,
} from 'react'
import {
  createEditor,
  CustomTypes,
  Descendant,
  Editor,
  Node,
  Text,
  Transforms,
} from 'slate'
import {
  Slate,
  Editable,
  withReact,
  RenderLeafProps,
  ReactEditor,
  RenderElementProps,
} from 'slate-react'

import styles from '../styles/Generator.module.css'

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

const CustomEditor = {
  generateText(text: string, bold = false, style = 'fraktur') {
    return Aesthetically.format(
      Aesthetically.unformat(text),
      bold ? 'fraktur-bold' : 'fraktur'
    )
  },
  isBoldMarkActive(editor: ReactEditor) {
    // console.log(Editor.marks(editor))
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
      const currentSelection = { ...editor.selection }
      const text = Aesthetically.unformat(
        Editor.string(editor, editor.selection)
      )
      if (text.length) {
        const currentFragment = editor.getFragment()
        const newFragment = transformTextInFragment(currentFragment, (text) => {
          return {
            ...text,
            text: this.generateText(text.text, !isBold),
          }
        })
        Transforms.insertFragment(editor, newFragment)
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

  const renderElement = useCallback((props: RenderElementProps) => {
    return <Element {...props} />
  }, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />
  }, [])

  return (
    <Slate editor={editor} value={initialValue}>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Type Something"
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={styles.editable}
      />
    </Slate>
  )
}

const Element = (props: RenderElementProps) => {
  return <div className={styles.element}>{props.children}</div>
}

const Leaf = (props: RenderLeafProps) => {
  const Tag = props.leaf.bold ? 'strong' : 'span'

  return (
    <>
      <Tag {...props.attributes}>{props.children}</Tag>
    </>
  )
}

function transformTextInFragment(
  fragment: Descendant[],
  transform: (text: CustomTypes['Text']) => CustomTypes['Text']
) {
  const out: Descendant[] = []
  for (const node of fragment) {
    if ('text' in node) {
      out.push(transform(node))
    } else {
      const element: CustomTypes['Element'] = {
        ...node,
        children: node.children.map((text) => transform(text)),
      }
      out.push(element)
    }
  }
  return out
}
