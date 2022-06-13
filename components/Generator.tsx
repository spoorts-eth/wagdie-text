import Aesthetically from 'aesthetically'
import cx from 'classnames'
import isHotKey from 'is-hotkey'
import React, {
  ClipboardEventHandler,
  CompositionEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react'
import {
  createEditor,
  CustomTypes,
  Descendant,
  Editor,
  Transforms,
} from 'slate'
import {
  Slate,
  Editable,
  withReact,
  RenderLeafProps,
  ReactEditor,
  RenderElementProps,
  useSlate,
} from 'slate-react'

import styles from '../styles/Generator.module.css'

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

const CustomEditor = {
  generateText(text: string, bold = false, fontEnabled = true) {
    const baseText = Aesthetically.unformat(text)
    if (!fontEnabled) return baseText
    return Aesthetically.format(baseText, bold ? 'fraktur-bold' : 'fraktur')
  },
  isBoldMarkActive(editor: ReactEditor) {
    const marks = Editor.marks(editor)
    return marks ? marks.bold === true : false
  },

  toggleFontEnabled(editor: ReactEditor, fontEnabled?: boolean) {
    const isBold = CustomEditor.isBoldMarkActive(editor)
    const currentSelection = { ...editor.selection }
    // select all
    Transforms.select(editor, {
      anchor: Editor.start(editor, []),
      focus: Editor.end(editor, []),
    })
    const newFragment = transformTextInFragment(editor.children, (text) => {
      return {
        ...text,
        text: this.generateText(text.text, text.bold, fontEnabled),
      }
    })
    Transforms.insertFragment(editor, newFragment)
    // todo how to make this work (we probably need to count the grapheme clusters)
    // Transforms.setSelection(editor, currentSelection)
  },

  toggleBoldMark(editor: ReactEditor, fontEnabled?: boolean) {
    const isBold = CustomEditor.isBoldMarkActive(editor)
    if (isBold) {
      Editor.removeMark(editor, 'bold')
    } else {
      Editor.addMark(editor, 'bold', true)
    }
    if (editor.selection?.anchor) {
      const currentSelection = { ...editor.selection }
      const text = Editor.string(editor, editor.selection)
      if (text.length) {
        const currentFragment = editor.getFragment()
        const newFragment = transformTextInFragment(currentFragment, (text) => {
          return {
            ...text,
            text: this.generateText(text.text, !isBold, fontEnabled),
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
  const [fontEnabled, setFontEnabled] = useState(true)

  const generateText = useCallback(
    (text: string, bold = false) => {
      return CustomEditor.generateText(text, bold, fontEnabled)
    },
    [fontEnabled]
  )

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      const isBold = CustomEditor.isBoldMarkActive(editor)
      if (isHotKey('mod+b', event)) {
        event.preventDefault()
        CustomEditor.toggleBoldMark(editor, fontEnabled)
        return
      }
      if (event.metaKey) return
      if (/^[a-zA-Z\!\?]$/.test(event.key)) {
        event.preventDefault()
        editor.insertText(generateText(event.key, isBold))
      }
    },
    [editor, fontEnabled, generateText]
  )

  // Android and IME keyboards fire composition events instead of keydown
  const onBeforeInput: CompositionEventHandler = useCallback(
    (event) => {
      console.log(event);
      const isBold = CustomEditor.isBoldMarkActive(editor)
      event.preventDefault()
      editor.insertText(generateText(event.data, isBold))
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

  return (
    <div className={styles.editor}>
      <Slate editor={editor} value={initialValue}>
        <Topbar fontEnabled={fontEnabled} setFontEnabled={setFontEnabled} />
        <Editable
          autoFocus
          renderLeaf={renderLeaf}
          placeholder="Type Something"
          // TODO: work out how to pick onBeforeInput OR onKeyDown to make android work
          // onBeforeInput={onBeforeInput as any} // type is wrong here android sends compositionEvent
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className={styles.content}
        />
      </Slate>
    </div>
  )
}

const Topbar = ({
  fontEnabled,
  setFontEnabled,
}: {
  fontEnabled?: boolean
  setFontEnabled: (enabled: boolean) => void
}) => {
  const editor = useSlate()
  const toggleBold: MouseEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      CustomEditor.toggleBoldMark(editor, fontEnabled)
    },
    [editor, fontEnabled]
  )
  const toggleFontEnabled: MouseEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      setFontEnabled(!fontEnabled)
      CustomEditor.toggleFontEnabled(editor, !fontEnabled)
    },
    [editor, fontEnabled, setFontEnabled]
  )
  return (
    <div className={styles.topbar}>
      <div>
        <Button
          isActive={CustomEditor.isBoldMarkActive(editor)}
          onMouseDown={toggleBold}
        >
          <Icon>format_bold</Icon>
        </Button>
      </div>
      <div>
        <Button isActive={fontEnabled} onMouseDown={toggleFontEnabled}>
          {fontEnabled ? 'ON' : 'OFF'}
        </Button>
      </div>
    </div>
  )
}

const Button = ({
  children,
  isActive,
  ...props
}: React.ComponentProps<'span'> & { isActive?: boolean }) => {
  return (
    <span
      className={cx(styles.button, {
        [styles.active]: isActive,
      })}
      {...props}
    >
      {children}
    </span>
  )
}

const Icon = ({ children }: React.PropsWithChildren) => {
  return <span className={cx('material-icons', styles.icon)}>{children}</span>
}

const Leaf = (props: RenderLeafProps) => {
  const Tag = props.leaf.bold ? 'strong' : 'span'

  return <Tag {...props.attributes}>{props.children}</Tag>
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
