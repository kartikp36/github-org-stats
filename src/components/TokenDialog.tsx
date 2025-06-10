'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TokenDialogProps {
  onTokenChange: (token: string) => void;
  currentToken: string;
}

export function TokenDialog({ onTokenChange, currentToken }: TokenDialogProps) {
  const [token, setToken] = useState(currentToken);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onTokenChange(token);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          {currentToken ? 'Update GitHub Token' : 'Add GitHub Token'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>GitHub Token</DialogTitle>
          <DialogDescription>
            Add your GitHub personal access token to increase API rate limits
            and access private repositories. Your token is stored locally and
            never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Personal Access Token</label>
            <Input
              type='password'
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder='ghp_xxxxxxxxxxxxxxxxxxxx'
            />
          </div>

          <Alert>
            <AlertDescription>
              Create a personal access token (classic) with{' '}
              <code className='text-sm'>repo</code> and{' '}
              <code className='text-sm'>read:org</code> scopes at{' '}
              <a
                href='https://github.com/settings/tokens'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'>
                GitHub Settings
              </a>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Token</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
