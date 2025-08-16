'use client';
import React from 'react';
import ChatScreen from '../../../../components/ChatScreen';
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
