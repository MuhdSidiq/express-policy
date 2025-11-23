import { useEffect, useState } from 'react';
import { usePolicyStore } from '../../stores/policyStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';

export default function PoliciesPage() {
  const { policies, isLoading, fetchPolicies, createPolicy, deletePolicy } = usePolicyStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPolicy(formData);
      setShowForm(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      await deletePolicy(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policies</h2>
          <p className="text-muted-foreground">Manage permission policies</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Policy</CardTitle>
            <CardDescription>Add a new policy to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ManageOwnOrders"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Can manage own orders only"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Policy</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {policies.map(policy => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{policy.name}</CardTitle>
                    <CardDescription>{policy.description || 'No description'}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Permissions:</strong> {policy._count?.permissions || 0}
                  </p>
                  <p>
                    <strong>Roles:</strong> {policy._count?.roles || 0}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={policy.isActive ? 'text-green-600' : 'text-red-600'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
