"use client"
import React, { useState } from 'react'
import TopBar from './TopBar'
import SideBar from './SideBar'
import ModalRender from './ModalRender'


const MainPage = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = (modalType: string, data?: any) => {
    setActiveModal(modalType);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  return (
    <div className='w-screen h-screen flex flex-col'>
      <ModalRender activeModal={activeModal} closeModal={closeModal} modalData={modalData} />
      <div className='w-full'><TopBar openModal={openModal} /></div>
      <div className='flex-1 flex'>
        <SideBar/>
        <div className='flex-1 bg-[#F5F5F5]'>
          {/* <Courier openModal={openModal} /> */}
        </div>
      </div>
    </div>
  )
}

export default MainPage
