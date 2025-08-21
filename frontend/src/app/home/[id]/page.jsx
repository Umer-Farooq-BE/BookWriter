'use client';
import React from 'react';
import ChatScreen from '../../../../components/Organisms/ChatScreen/ChatScreen';
import { useParams } from 'next/navigation';

export default function HomeBookPage() {
  const params = useParams();
  const { id } = params;
  return (
    <div className="mainBg">
      <ChatScreen initialBookId={id} />
    </div>
  );
}
