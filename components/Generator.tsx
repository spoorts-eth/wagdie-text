import Aesthetically from 'aesthetically'
import cx from 'classnames'
import isHotKey from 'is-hotkey'
import React, {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  createEditor,
  CustomTypes,
  Descendant,
  Editor,
  Path,
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
import { toast } from 'react-toastify'

import styles from '../styles/Generator.module.css'
import Icon from './Icon'

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

  toggleBoldMark(editor: ReactEditor) {
    const isBold = CustomEditor.isBoldMarkActive(editor)
    if (isBold) {
      Editor.removeMark(editor, 'bold')
    } else {
      Editor.addMark(editor, 'bold', true)
    }
  },

  getAllText(editor: ReactEditor): string {
    return editor.children
      .map((n) => {
        if ('type' in n) {
          return n.children.map((c) => c.text).join('')
        }
        return n.text
      })
      .join('\n')
  },
}

export default function Generator({ onChange }: { onChange?: () => void }) {
  const [fontEnabled, setFontEnabled] = useState(true)
  // used by normalizeNode below
  const fontEnabledRef = useRef(fontEnabled)
  fontEnabledRef.current = fontEnabled

  const [editor] = useState(() => {
    const editor = withReact(createEditor())
    const baseNormalizeNode = editor.normalizeNode
    editor.normalizeNode = ([node, path]) => {
      if ('text' in node) {
        const { bold, text } = node
        const normalizedText = generateText(text, bold)
        if (text !== normalizedText) {
          const { selection } = editor
          Transforms.removeNodes(editor, { at: path })
          Transforms.insertNodes(
            editor,
            { ...node, text: normalizedText },
            { at: path }
          )
          if (selection) {
            const { anchor, focus } = selection
            const { path: anchorPath, offset: anchorOffset } = anchor
            const { path: focusPath, offset: focusOffset } = focus
            const isAnchorNode = isPathEqual(anchorPath, path)
            const isFocusNode = isPathEqual(focusPath, path)
            Transforms.select(editor, {
              anchor: isAnchorNode ? {
                path: anchorPath,
                offset: convertStringOffset(text, normalizedText, anchorOffset),
              } : anchor,
              focus: isFocusNode ? {
                path: focusPath,
                offset: convertStringOffset(text, normalizedText, focusOffset),
              } : focus,
            })
          }
          return
        }
      }
      baseNormalizeNode([node, path])
    }

    return editor
  })

  // when the fontEnabled state changes, we need to update the text in the editor
  useEffect(() => {
    CustomEditor.toggleFontEnabled(editor, !fontEnabled)
  }, [editor, fontEnabled])

  const generateText = useCallback((text: string, bold = false) => {
    // use the ref so that normalizeNode can use it
    return CustomEditor.generateText(text, bold, fontEnabledRef.current)
  }, [])

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      if (isHotKey('mod+b', event)) {
        event.preventDefault()
        CustomEditor.toggleBoldMark(editor)
        return true
      }
      // TODO: IME keyboards don't fire this, how to handle them?
      if (!event.metaKey && !event.ctrlKey && onChange) onChange()
    },
    [editor, onChange]
  )

  const copyContents = useCallback(async () => {
    const text = CustomEditor.getAllText(editor)
    try {
      await navigator.clipboard.writeText(text)
      toast('Contents copied to clipboard', { toastId: 'copyContents' })
    } catch (error) {
      toast.error("Couldn't copy contents", { toastId: 'copyContents' })
    }
  }, [editor])

  const tweetContents = useCallback(async () => {
    const text = CustomEditor.getAllText(editor)
    const a = document.createElement('a')
    a.href = `https://twitter.com/intent/tweet?hashtags=WAGDIE&text=${encodeURIComponent(
      text
    )}`
    a.setAttribute('target', '_blank')
    a.click()
  }, [editor])

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
          onKeyDown={onKeyDown}
          className={styles.content}
        />
        <div className={styles.bottombar}>
          <ActionButton onClick={copyContents}>
            <Icon>copy</Icon>
          </ActionButton>
          <ActionButton onClick={tweetContents}>
            <Icon>twitter</Icon>
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
  const onMouseDown: MouseEventHandler = useCallback(
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
      CustomEditor.toggleBoldMark(editor)
    },
    [editor]
  )
  const toggleFontEnabled: MouseEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      setFontEnabled(!fontEnabled)
    },
    [fontEnabled, setFontEnabled]
  )
  return (
    <div className={styles.topbar}>
      <div className={styles.topbarSection}>
        <ToggleButton
          isActive={CustomEditor.isBoldMarkActive(editor)}
          onMouseDown={toggleBold}
        >
          <Icon>bold</Icon>
        </ToggleButton>
      </div>
      <div>
        <ToggleButton isActive={fontEnabled} onMouseDown={toggleFontEnabled}>
          <Icon>{fontEnabled ? 'toggle_on' : 'toggle_off'}</Icon>
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

function isPathEqual(path1: Path, path2: Path) {
  return path1.every((n, i) => n === path2[i])
}

// When coverting between regular alphabet (each character is one unicode code point) and
// fraktur (each character is two unicode code points) we need to move the cursor to the correct
// position.
//
// This function takes an input string and offset and returns the offset in the new string such that
// it points at the nth the character still.
function convertStringOffset(
  inputString: string,
  outputString: string,
  offset: number
) {
  // iterators work on unicode characters not code points
  const inputCharCount = [...inputString.slice(0, offset)].length
  return [...outputString].slice(0, inputCharCount).join('').length
}
