
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GroupCodeRedemption from '@/components/listener/GroupCodeRedemption'
import GroupPackNotifications from '@/components/listener/GroupPackNotifications'
import GroupRewardDistribution from '@/components/listener/GroupRewardDistribution'
import { Users, Bell, Gift } from 'lucide-react'

export default function GroupPacksPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('redemption')

  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please sign in to access group packs</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Group Packs</h1>
        <p className="text-muted-foreground">
          Join group packs to unlock albums together and save money!
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="redemption" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Packs
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="redemption" className="space-y-6">
          <GroupCodeRedemption />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Pack Updates</CardTitle>
              <CardDescription>
                Stay updated on your group pack progress and redemption opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupPackNotifications />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <GroupRewardDistribution />
        </TabsContent>
      </Tabs>
    </div>
  )
}
