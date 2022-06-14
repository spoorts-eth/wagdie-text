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
  useRef,
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

export default function Generator({ onChange }: { onChange?: () => void }) {
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
      if (event.metaKey || event.ctrlKey) return
      if (/^[a-zA-Z\!\?]$/.test(event.key)) {
        event.preventDefault()
        if (onChange) onChange();
        editor.insertText(generateText(event.key, isBold))
      }
    },
    [editor, fontEnabled, generateText, onChange]
  )

  // Android and IME keyboards fire composition events instead of keydown
  const onBeforeInput: CompositionEventHandler = useCallback(
    (event) => {
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
      if (onChange) onChange()
      editor.insertText(generateText(text, isBold))
    },
    [editor, generateText, onChange]
  )

  const copyContents = useCallback(() => {
    const text = editor.children.map((n) => {
      if ('type' in n) {
        return n.children.map((c) => c.text).join('')
      }
      return n.text;
    }).join('\n');
    navigator.clipboard.writeText(text)
  }, [editor]);

  const renderElement = useCallback((props: RenderElementProps) => {
    return <Element {...props} />
  }, [])

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
          renderElement={renderElement}
          placeholder="Type Something"
          // TODO: work out how to pick onBeforeInput OR onKeyDown to make android work
          // onBeforeInput={onBeforeInput as any} // type is wrong here android sends compositionEvent
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className={styles.content}
        />
        <div className={styles.bottombar}>
          <ActionButton onClick={copyContents}>
            <Icon>copy_all</Icon>
          </ActionButton>
        </div>
      </Slate>
    </div>
  )
}

const ActionButton = ({
  children,
  size,
  onClick,
  ...props
}: React.ComponentProps<'span'> & {
  size?: ButtonSize
  onClick: MouseEventHandler
}) => {
  const button = useRef<HTMLSpanElement>(null)
  const onMouseDown = useCallback(
    (event) => {
      button.current?.animate(
        [
          { transform: 'scale(0.9)', easing: 'ease-in-out' },
          { transform: 'scale(1)' },
        ],
        100
      )
      onClick(event)
    },
    [onClick]
  )
  return (
    <span
      className={cx(styles.actionButton, {
        [styles.medium]: size === ButtonSize.Medium,
      })}
      ref={button}
      onMouseDown={onMouseDown}
      {...props}
    >
      {children}
    </span>
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
      <div className={styles.topbarSection}>
        <ToggleButton
          isActive={CustomEditor.isBoldMarkActive(editor)}
          onMouseDown={toggleBold}
        >
          <Icon>format_bold</Icon>
        </ToggleButton>
      </div>
      <div>
        <ToggleButton
          isActive={fontEnabled}
          onMouseDown={toggleFontEnabled}
          size={ButtonSize.Medium}
        >
          {fontEnabled ? 'ON' : 'OFF'}
        </ToggleButton>
      </div>
    </div>
  )
}

enum ButtonSize {
  Medium,
}

const ToggleButton = ({
  children,
  isActive,
  size,
  ...props
}: React.ComponentProps<'span'> & {
  isActive?: boolean
  size?: ButtonSize
}) => {
  return (
    <span
      className={cx(styles.toggleButton, {
        [styles.active]: isActive,
        [styles.medium]: size === ButtonSize.Medium,
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

const Element = (props: RenderElementProps) => {
  return (
    <div {...props.attributes} className={styles.element}>
      {props.children}
    </div>
  )
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
