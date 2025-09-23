import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Crown,
  Dumbbell,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import ambassadorService from '../../../services/ambassador.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AmbassadorCodeManager = () => {
  const [ambassadorCodes, setAmbassadorCodes] = useState([]);
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    ambassadorId: '',
    code: '',
    discountPercentage: '',
    validFor: 'all', // 'products', 'coaching', 'all'
    maxUses: '',
    expiryDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [codesData, ambassadorsData] = await Promise.all([
        ambassadorService.getAllAmbassadorCodes(),
        ambassadorService.getAmbassadors()
      ]);
      
      setAmbassadorCodes(codesData.data || []);
      setAmbassadors(ambassadorsData.data || []);
    } catch (error) {
      console.error('Error loading ambassador data:', error);
      toast.error('Failed to load ambassador data');
      setAmbassadorCodes([]);
      setAmbassadors([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter ambassadors by role with debugging
  const coaches = ambassadors.filter(a => a.role === 'coach');
  const affiliates = ambassadors.filter(a => a.role === 'affiliate');
  const taskforce = ambassadors.filter(a => a.role === 'taskforce');

  // Debug logging
  console.log('🔍 DROPDOWN DEBUG:', {
    totalAmbassadors: ambassadors.length,
    rawAmbassadors: ambassadors.map(a => ({
      id: a._id,
      name: `${a.firstName} ${a.lastName}`,
      email: a.email,
      role: a.role
    })),
    coachesFiltered: coaches.length,
    coachesData: coaches.map(c => ({
      id: c._id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      role: c.role
    })),
    affiliatesFiltered: affiliates.length,
    affiliatesData: affiliates.map(a => ({
      id: a._id,
      name: `${a.firstName} ${a.lastName}`,
      email: a.email,
      role: a.role
    })),
    taskforceFiltered: taskforce.length,
    taskforceData: taskforce.map(t => ({
      id: t._id,
      name: `${t.firstName} ${t.lastName}`,
      email: t.email,
      role: t.role
    }))
  });

  const getRoleIcon = (role) => {
    switch(role) {
      case 'coach': return <Dumbbell className="h-4 w-4" />;
      case 'affiliate': return <Crown className="h-4 w-4" />;
      case 'taskforce': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'coach': return 'bg-blue-100 text-blue-800';
      case 'affiliate': return 'bg-purple-100 text-purple-800';
      case 'taskforce': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async () => {
    
    if (!formData.ambassadorId || !formData.code || !formData.discountPercentage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        discountPercentage: parseInt(formData.discountPercentage),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expiryDate: formData.expiryDate || null
      };

      if (editingCode) {
        await ambassadorService.updateAmbassadorCode(editingCode._id, payload);
        toast.success('Ambassador code updated successfully!');
      } else {
        await ambassadorService.createAmbassadorCode(payload);
        toast.success('Ambassador code created successfully!');
      }

      // Reset form
      setFormData({
        ambassadorId: '',
        code: '',
        discountPercentage: '',
        validFor: 'all',
        maxUses: '',
        expiryDate: ''
      });
      setShowCreateForm(false);
      setEditingCode(null);
      loadData();
      
    } catch (error) {
      console.error('Error saving ambassador code:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save ambassador code';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (code) => {
    setFormData({
      ambassadorId: code.ambassador._id,
      code: code.code,
      discountPercentage: code.discountPercentage.toString(),
      validFor: code.validFor[0] || 'all',
      maxUses: code.maxUses ? code.maxUses.toString() : '',
      expiryDate: code.expiryDate ? new Date(code.expiryDate).toISOString().split('T')[0] : ''
    });
    setEditingCode(code);
    setShowCreateForm(true);
  };

  const handleDelete = async (codeId) => {
    try {
      await ambassadorService.deleteAmbassadorCode(codeId);
      toast.success('Ambassador code deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting ambassador code:', error);
      toast.error('Failed to delete ambassador code');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const toggleCodeStatus = async (codeId, currentStatus) => {
    try {
      await ambassadorService.toggleAmbassadorCodeStatus(codeId, !currentStatus);
      toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadData();
    } catch (error) {
      console.error('Error toggling code status:', error);
      toast.error('Failed to update code status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50dvh] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading ambassador codes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] p-4 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {ambassadorCodes.filter(c => c.isActive).length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold text-green-600">
                  {ambassadorCodes.reduce((sum, c) => sum + (c.totalUses || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(ambassadorCodes.reduce((sum, c) => sum + (c.totalCommissionEarned || 0), 0) / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready Ambassadors</p>
                <p className="text-2xl font-bold text-orange-600">
                  {ambassadors.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {coaches.length} coaches, {affiliates.length} affiliates, {taskforce.length} taskforce
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Code Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ambassador Codes</h3>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={ambassadors.length === 0}>
              <Plus className="h-4 w-4" />
              Create Ambassador Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit' : 'Create'} Ambassador Code</DialogTitle>
              <DialogDescription>
                {editingCode ? 'Update the ambassador code details.' : 'Create a new code for a coach, affiliate, or taskforce member to share with their audience.'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ambassadorId">Coach/Affiliate/Taskforce *</Label>
                  <select
                    id="ambassadorId"
                    value={formData.ambassadorId}
                    onChange={(e) => {
                      console.log('🔧 SIMPLE SELECT CHANGE:', e.target.value);
                      setFormData({...formData, ambassadorId: e.target.value});
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">
                      {ambassadors.length > 0 ? "Select an ambassador" : "No ambassadors available"}
                    </option>
                    
                    {coaches.length > 0 && (
                      <optgroup label="🏋️ Coaches">
                        {coaches.map(coach => {
                          console.log('🔧 RENDERING COACH OPTION:', coach);
                          return (
                            <option key={coach._id} value={coach._id}>
                              {coach.firstName} {coach.lastName} ({coach.email})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    
                    {affiliates.length > 0 && (
                      <optgroup label="👑 Affiliates">
                        {affiliates.map(affiliate => (
                          <option key={affiliate._id} value={affiliate._id}>
                            {affiliate.firstName} {affiliate.lastName} ({affiliate.email})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {taskforce.length > 0 && (
                      <optgroup label="🛡️ Taskforce">
                        {taskforce.map(member => (
                          <option key={member._id} value={member._id}>
                            {member.firstName} {member.lastName} ({member.email})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-xs text-gray-500">
                    Select a coach, affiliate, or taskforce member to create a code for
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g. SARAH20"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Discount Percentage *</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    placeholder="e.g. 20"
                    min="1"
                    max="50"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validFor">Valid For</Label>
                  <select
                    id="validFor"
                    value={formData.validFor}
                    onChange={(e) => setFormData({...formData, validFor: e.target.value})}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="all">All (Products + Coaching)</option>
                    <option value="products">Products Only</option>
                    <option value="coaching">Coaching Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses (optional)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="text-black hover:text-white hover:bg-black border-black" onClick={() => {
                  setShowCreateForm(false);
                  setEditingCode(null);
                  setFormData({
                    ambassadorId: '',
                    code: '',
                    discountPercentage: '',
                    validFor: 'all',
                    maxUses: '',
                    expiryDate: ''
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={ambassadors.length === 0}>
                  {editingCode ? 'Update' : 'Create'} Code
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ambassador Codes List */}
      <div className="space-y-4 pb-8">
        {ambassadorCodes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Tag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Ambassador Codes</h3>
              <p>Create your first ambassador code for coaches, affiliates, or taskforce members to get started.</p>
            </CardContent>
          </Card>
        ) : (
          ambassadorCodes.map((code) => (
            <Card key={code._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-xl font-bold">{code.code}</span>
                      <Badge variant={code.isActive ? "default" : "secondary"}>
                        {code.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {code.discountPercentage}% OFF
                      </Badge>
                      <Badge variant="outline">
                        {code.validFor?.includes('all') ? 'All' : code.validFor?.includes('products') ? 'Products' : 'Coaching'}
                      </Badge>
                      {code.ambassador?.role && (
                        <Badge className={getRoleBadgeColor(code.ambassador.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(code.ambassador.role)}
                            <span className="capitalize">{code.ambassador.role}</span>
                          </div>
                        </Badge>
                      )}
                      {code.ambassador?.payoutSetupComplete && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Payout Ready
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Ambassador:</strong> {code.ambassador?.firstName} {code.ambassador?.lastName} ({code.ambassador?.email})
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {code.totalUses || 0} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${((code.totalCommissionEarned || 0) / 100).toFixed(2)} earned
                      </span>
                      {code.maxUses && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {code.maxUses - (code.totalUses || 0)} remaining
                        </span>
                      )}
                      {code.expiryDate && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Expires {new Date(code.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(code.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCodeStatus(code._id, code.isActive)}
                    >
                      {code.isActive ? 'Deactivate' : 'Activate'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(code)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ambassador Code</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the code "{code.code}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(code._id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AmbassadorCodeManager;