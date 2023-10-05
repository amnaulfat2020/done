import { createContext, useContext, useState } from 'react';
import MenuBar from '../layout/MenuBar';

const PageContext = createContext();

export function PageProvider(props) {
const state ={
  "currentPage": 'Dashboard', 
  "userName": "Moiz"
}
  // const setPage = (pageName) => {
  //   setCurrentPage(pageName);
  // };

  return (
    <PageContext.Provider value={state}>
      {props.children}
    </PageContext.Provider>
  );
}

export function usePage() {
  return useContext(PageContext);
}
