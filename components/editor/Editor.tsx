'use client';

import Theme from './plugins/Theme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { FloatingComposer, FloatingThreads, liveblocksConfig, LiveblocksPlugin, useEditorStatus} from '@liveblocks/react-lexical';
import FloatingToolbarPlugin from './plugins/FloatingToolbarPlugin';
import React from 'react';
import Loader from '../Loader';
import { useThreads } from '@liveblocks/react/suspense';
import Comments from '../ui/Comments';
import DownloadButton from '../DownloadButton';

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}
type UserType = "creator" | "editor" | "viewer";

export function Editor({currentUserType }:{ currentUserType:UserType}) {

  const {threads} = useThreads();

  const initialConfig = liveblocksConfig({
    namespace: 'Editor',
    nodes: [HeadingNode],
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    theme: Theme,
    editable: currentUserType === 'editor',
  })
  const status = useEditorStatus();

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container size-full">
        <div className='z-50 custom-scrollbar w-screen overflow-auto border-y border-dark-300 bg-dark-100 pl-3 pr-4 shadow-sm flex min-w-full justify-between'>
          <ToolbarPlugin />
        </div>

        <div className='custom-scrollbar h-[calc(100vh-140px)] gap-5 overflow-auto px-5 pt-5 lg:flex-row lg:items-start lg:justify-center  xl:gap-10 xl:pt-10 flex flex-col items-center justify-start'>
          {status === 'not-loaded' || status === 'loading' ? <Loader/> : (
            <div className="editor-inner min-h-[1100px] relative mb-5 h-fit w-full max-w-[800px] shadow-md lg:mb-10">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-input h-full" />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />

            {currentUserType === 'editor' && <FloatingToolbarPlugin />}
            <HistoryPlugin />
            <AutoFocusPlugin />
            <DownloadButton documentTitle="Document" />
          </div>
            )}
            <LiveblocksPlugin>
              <FloatingComposer className='w-[350px]'/>
              <FloatingThreads threads={threads}/>
              <Comments />
            </LiveblocksPlugin>
        </div>
      </div>
    </LexicalComposer>
  );
}
