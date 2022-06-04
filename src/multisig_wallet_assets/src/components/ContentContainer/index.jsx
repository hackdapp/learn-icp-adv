import TopNavigation from '../TopNavigation';
import { BsPlusCircleFill } from 'react-icons/bs';
// import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';


const ContentContainer = () => {
  return (
    <div className='content-container border-zinc-300'>
      <TopNavigation />
      <div className='content-list'>
				{/* <CodeMirror
					value="console.log('hello world!');"
					height="500px"
					width="100%"
					extensions={[javascript({ jsx: true })]}
					onChange={(value, viewUpdate) => {
						console.log('value:', value);
					}}
				/> */}
				{/* <CodeMirror
					value="console.log('hello world!');"
					height="200px"
					extensions={[javascript({ jsx: true })]}
					onChange={(value, viewUpdate) => {
						console.log('value:', value);
					}}
				/> */}
      </div>
      {/* <BottomBar /> */}
    </div>
  );
};

const CodeEditor =  () => {

};

const BottomBar = () => (
  <div className='bottom-bar'>
    <PlusIcon />
    <input type='text' placeholder='Enter message...' className='bottom-bar-input' />
  </div>
);

const Post = ({ name, timestamp, text }) => {
  const seed = Math.round(Math.random() * 100);
  return (
    <div className={'post'}>
      <div className='avatar-wrapper'>
        <img src={`https://avatars.dicebear.com/api/open-peeps/${seed}.svg`} alt='' className='avatar' />
      </div>

      <div className='post-content'>
        <p className='post-owner'>
          {name}
          <small className='timestamp'>{timestamp}</small>
        </p>
        <p className='post-text'>{text}</p>
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <BsPlusCircleFill
    size='22'
    className='text-green-500 dark:shadow-lg mx-2 dark:text-primary'
  />
);

export default ContentContainer;
