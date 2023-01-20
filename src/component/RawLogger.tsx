import React, { useState, ReactNode, useEffect, useContext, useLayoutEffect } from 'react';
import Anser, { AnserJsonEntry } from 'anser';
import { escapeCarriageReturn } from 'escape-carriage';
import { Partical } from '../matcher';
import { ErrorMatcher, ErrorMatcherPattern } from '../errorMatcher';
import { usePopper } from 'react-popper';
import { Popper, Arrow, Manager } from 'react-popper';
import styles from '../style/log.module.less';
import { ErrorContext } from '../model/ErrorContext';
import { useFloating } from '@floating-ui/react';
export interface RawLoggerProps {
  partical: Partical;
  errorMatcher: ErrorMatcher;
  index: number;
  foldable?: boolean;
  useClasses?: boolean;
  linkify?: boolean;
  style?: React.CSSProperties;
  updateActiveLine: () => void;
}

const LINK_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

/**
 * Create a class string.
 * @name createClass
 * @function
 * @param {AnserJsonEntry}.
 * @return {String} class name(s)
 */
function createClass(bundle: AnserJsonEntry) {
  let classNames: string = '';

  if (!bundle.bg && !bundle.fg) {
    return '';
  }
  if (bundle.bg) {
    classNames += bundle.bg + ' ';
  }
  if (bundle.fg) {
    classNames += bundle.fg + ' ';
  }

  classNames = classNames.substring(0, classNames.length - 1);
  return classNames;
}

/**
 * Create the style attribute.
 * @name createStyle
 * @function
 * @param {AnserJsonEntry}.
 * @return {Object} returns the style object
 */
function createStyle(bundle: AnserJsonEntry) {
  const style: { backgroundColor?: string; color?: string } = {};
  if (bundle.bg) {
    style.backgroundColor = `rgb(${bundle.bg})`;
  }
  if (bundle.fg) {
    style.color = `rgb(${bundle.fg})`;
  }

  return style;
}

function isEmpty(style: null | object) {
  return !style || Object.keys(style).length === 0;
}

function ansiToJSON(input: string, useClasses = false) {
  input = escapeCarriageReturn(input);
  return Anser.ansiToJson(input, {
    json: true,
    remove_empty: true,
    use_classes: useClasses,
  });
}

function convertBundleIntoReact(
  useClasses: boolean,
  linkify: boolean,
  bundle: AnserJsonEntry,
  key: number,
) {
  const style = useClasses ? null : createStyle(bundle);
  const className = useClasses ? createClass(bundle) : '';

  let content: ReactNode[] | string = bundle.content;
  if (linkify) {
    content = bundle.content.split(/(\s+)/).reduce((words, word, index) => {
      if (index % 2 === 1) {
        words.push(word);
        return words;
      }

      const matches = LINK_REGEX.exec(word);
      if (!matches) {
        words.push(word);
        return words;
      }

      const matchedUrl = matches[0];
      words.push(
        <>
          {word.substring(0, matches.index)}
          <a key={index} href={matchedUrl} target="_blank" rel="noopener noreferer">
            {matchedUrl}
          </a>
          {word.substring(matches.index + matchedUrl.length)}
        </>,
      );

      return words;
    }, [] as React.ReactNode[]);
  }

  if (!isEmpty(style) || className) {
    return (
      <span style={style || {}} key={key}>
        {content}
      </span>
    );
  }

  return content;
}

// const Example1 = () => {
//   const [state, setState] = useState({
//     isOpen: false,
//     target: null,
//   });

//   const handleClick = () => {
//     setState((prevState) => ({
//       ...prevState,
//       isOpen: !prevState.isOpen,
//     }));
//   };

//   return (
//     <>
//       <div
//         ref={(div) => {
//           setState((old) => {
//             return { ...old, target: div };
//           });
//         }}
//         style={{ width: 120, height: 120, background: '#b4da55' }}
//         onClick={handleClick}
//       >
//         Click {state.isOpen ? 'to hide' : 'to show'} popper
//       </div>
//       {state.isOpen && (
//         <Popper placement="top" className="popper" target={state.target}>
//           {/* Popper Content for Standalone example */}
//           <Arrow className="popper__arrow" />
//         </Popper>
//       )}
//     </>
//   );
// };

function Trap() {
  const { x, y, strategy, refs } = useFloating();

  return (
    <>
      <button ref={refs.setReference}>Button</button>
      <div
        ref={refs.setFloating}
        style={{
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
          width: 'max-content',
        }}
      >
        Tooltip
      </div>
    </>
  );
}

const Example = () => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });

  return (
    <>
      <button type="button" ref={setReferenceElement}>
        Reference element
      </button>

      <div
        ref={setPopperElement}
        style={
          (styles.popper,
          {
            background: 'white',
          })
        }
        {...attributes.popper}
      >
        Popper element
        <div ref={setArrowElement} style={styles.arrow} />
      </div>
    </>
  );
};

export function RawLogger({
  partical,
  errorMatcher,
  index = 0,
  foldable = false,
  useClasses = false,
  linkify = false,
  forwardRef,
  style,
  updateActiveLine,
}: RawLoggerProps & { forwardRef?: React.ForwardedRef<any> }) {
  const { setErrorRefs } = useContext(ErrorContext);
  const lineProps = { useClasses, linkify, errorMatcher };
  const [fold, setFold] = useState(partical.fold);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  React.useEffect(() => {
    updateActiveLine();
  }, [isHovering]);

  const line = React.useMemo(() => {
    return ansiToJSON(partical.content).reduce(
      (prev, bundle, index) => {
        const content = convertBundleIntoReact(useClasses, linkify, bundle, index);
        const errors = errorMatcher.match(bundle);
        return {
          content: prev.content.concat([content]),
          errors: prev.errors.concat(errors),
        };
      },
      {
        content: [] as any,
        errors: [] as ErrorMatcher['patterns'],
      },
    );
  }, [partical, styles, useClasses, linkify, errorMatcher]);

  if (foldable) {
    return (
      <div className={fold ? styles.fold : styles.foldOpen} ref={forwardRef} style={style}>
        <div
          key={`folder-placeholder-${index}`}
          className={styles.foldLine}
          onClick={() => setFold(!fold)}
        >
          {partical.label
            ? ansiToJSON(partical.label).map(convertBundleIntoReact.bind(null, useClasses, linkify))
            : null}
        </div>
        <Line
          {...lineProps}
          line={line.content}
          errors={line.errors}
          index={index}
          saveRef={setErrorRefs}
        />
      </div>
    );
  }

  return (
    <div
      ref={forwardRef}
      style={style}
      key={`line-${index}`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {/* <pre>{JSON.stringify(line.content)}</pre> */}
      <Line
        {...lineProps}
        line={line.content}
        errors={line.errors}
        index={index}
        saveRef={setErrorRefs}
      />
      {/* <Menu>
        <MenuItem label={line.content.length} />
        <MenuItemCustom>
          <pre>
            {JSON.stringify({
              time: 'something',
            })}
          </pre>
        </MenuItemCustom>
      </Menu> */}
    </div>
  );
}

export function Line({
  line,
  errors,
  index,
  saveRef,
}: {
  line: string;
  errors: ErrorMatcher['patterns'];
  index: number;
  saveRef: (errors: ErrorMatcherPattern[], ref: HTMLDivElement) => void;
}) {
  const ref = React.createRef<HTMLDivElement>();

  useEffect(() => {
    if (errors.length && ref.current && saveRef) {
      saveRef(errors, ref.current);
    }
  }, [ref.current, errors]);

  return (
    <div className={`${styles.logLine} ${errors.length ? styles.error : ''}`} key={index} ref={ref}>
      <a className={styles.lineNo} key={`lineNo-${index}`}>
        {index}
      </a>
      {line}
    </div>
  );
}

export default React.forwardRef((props: RawLoggerProps, ref: React.ForwardedRef<any>) => (
  <RawLogger {...props} forwardRef={ref} />
));
