import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Settings, FolderKanban, Building2, Users, X, FileText, ToggleLeft, ToggleRight, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Project {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface Manager {
  id: string;
  full_name: string;
  employee_id: string;
}

interface ManagerDepartmentAssignment {
  id: string;
  manager_id: string;
  department_id: string;
  manager: Manager;
  department: Department;
}

interface Form {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  form_type: string;
  is_active: boolean;
}

interface DepartmentForm {
  id: string;
  department_id: string;
  form_id: string;
  is_enabled: boolean;
  form: Form;
}

export function GeneralSettings() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managerDepartments, setManagerDepartments] = useState<ManagerDepartmentAssignment[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [departmentForms, setDepartmentForms] = useState<{ [departmentId: string]: DepartmentForm[] }>({});
  const [activeTab, setActiveTab] = useState<'projects' | 'departments' | 'manager-departments' | 'forms'>('projects');
  
  // Manager-Department assignment state
  const [selectedManagerForDept, setSelectedManagerForDept] = useState('');
  const [selectedDepartmentsForManager, setSelectedDepartmentsForManager] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Project form state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null); // project id currently uploading logo
  const [projectLogoFile, setProjectLogoFile] = useState<File | null>(null);

  // Department form state
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
    fetchManagers();
    fetchManagerDepartments();
    fetchForms();
    fetchDepartmentForms();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Error loading projects');
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('Error loading departments');
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, employee_id')
        .eq('role', 'manager')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      alert('Error loading managers');
    }
  };

  const fetchManagerDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('manager_departments')
        .select(`
          id,
          manager_id,
          department_id,
          manager:users!manager_departments_manager_id_fkey(id, full_name, employee_id),
          department:departments!manager_departments_department_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManagerDepartments(data as any || []);
    } catch (error) {
      console.error('Error fetching manager departments:', error);
      alert('Error loading manager-department assignments');
    }
  };

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchDepartmentForms = async () => {
    try {
      const { data, error } = await supabase
        .from('department_forms')
        .select(`
          id,
          department_id,
          form_id,
          is_enabled,
          form:forms(id, name, display_name, description, form_type, is_active)
        `);

      if (error) throw error;
      
      // Group by department
      const grouped: { [key: string]: DepartmentForm[] } = {};
      (data || []).forEach((item: any) => {
        if (!grouped[item.department_id]) {
          grouped[item.department_id] = [];
        }
        grouped[item.department_id].push(item);
      });
      
      setDepartmentForms(grouped);
    } catch (error) {
      console.error('Error fetching department forms:', error);
    }
  };

  // Toggle form for department
  const handleToggleDepartmentForm = async (departmentFormId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('department_forms')
        .update({ is_enabled: !currentStatus })
        .eq('id', departmentFormId);

      if (error) throw error;
      
      console.log('Form access updated successfully');
      fetchDepartmentForms();
    } catch (error) {
      console.error('Error toggling form access:', error);
    }
  };

  // Project CRUD
  const handleAddProject = () => {
    setEditingProject(null);
    setProjectName('');
    setShowProjectModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setShowProjectModal(true);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      if (editingProject) {
        // Update existing
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectName.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProject.id);

        if (error) throw error;
        alert('Project updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('projects')
          .insert({
            name: projectName.trim()
          });

        if (error) throw error;
        alert('Project added successfully');
      }

      setShowProjectModal(false);
      fetchProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      if (error.code === '23505') {
        alert('A project with this name already exists');
      } else {
        alert('Error saving project');
      }
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project. It may be in use by existing users.');
    }
  };

  const handleToggleProjectStatus = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: !project.is_active })
        .eq('id', project.id);

      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Error updating project status');
    }
  };

  // Logo upload/delete functions
  const handleLogoUpload = async (projectId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      alert('Image size must be less than 500KB');
      return;
    }

    try {
      setUploadingLogo(projectId);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;

      console.log('Uploading logo:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-logos')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Update project with logo URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ logo_url: publicUrl })
        .eq('id', projectId);

      if (updateError) throw updateError;

      console.log('✅ Project logo updated successfully');
      fetchProjects();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(error.message || 'Error uploading logo. Please try again.');
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleLogoDelete = async (project: Project) => {
    if (!project.logo_url) return;
    if (!confirm(`Remove logo from "${project.name}"?`)) return;

    try {
      setUploadingLogo(project.id);

      // Extract file path from URL
      const urlParts = project.logo_url.split('/project-logos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('project-logos')
          .remove([filePath]);

        if (deleteError) {
          console.error('Error deleting from storage:', deleteError);
        }
      }

      // Update project to remove logo URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ logo_url: null })
        .eq('id', project.id);

      if (updateError) throw updateError;

      console.log('✅ Project logo removed');
      fetchProjects();
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Error removing logo');
    } finally {
      setUploadingLogo(null);
    }
  };

  // Department CRUD
  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setDepartmentName('');
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setShowDepartmentModal(true);
  };

  const handleSaveDepartment = async () => {
    if (!departmentName.trim()) {
      alert('Department name is required');
      return;
    }

    try {
      if (editingDepartment) {
        // Update existing
        const { error } = await supabase
          .from('departments')
          .update({
            name: departmentName.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDepartment.id);

        if (error) throw error;
        alert('Department updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('departments')
          .insert({
            name: departmentName.trim()
          });

        if (error) throw error;
        alert('Department added successfully');
      }

      setShowDepartmentModal(false);
      fetchDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      if (error.code === '23505') {
        alert('A department with this name already exists');
      } else {
        alert('Error saving department');
      }
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete department "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department. It may be in use by existing users.');
    }
  };

  const handleToggleDepartmentStatus = async (department: Department) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: !department.is_active })
        .eq('id', department.id);

      if (error) throw error;
      fetchDepartments();
    } catch (error) {
      console.error('Error updating department status:', error);
      alert('Error updating department status');
    }
  };

  // Manager-Department Assignment CRUD
  const handleOpenAssignModal = () => {
    setSelectedManagerForDept('');
    setSelectedDepartmentsForManager([]);
    setShowAssignModal(true);
  };

  const handleAssignDepartments = async () => {
    if (!selectedManagerForDept || selectedDepartmentsForManager.length === 0) {
      alert('Please select a manager and at least one department');
      return;
    }

    try {
      // Insert assignments (will skip if already exists due to unique constraint)
      const assignments = selectedDepartmentsForManager.map(deptId => ({
        manager_id: selectedManagerForDept,
        department_id: deptId
      }));

      const { error } = await supabase
        .from('manager_departments')
        .insert(assignments);

      if (error) {
        if (error.code === '23505') {
          alert('One or more department assignments already exist for this manager');
        } else {
          throw error;
        }
        return;
      }

      alert('Departments assigned successfully!');
      setShowAssignModal(false);
      setSelectedManagerForDept('');
      setSelectedDepartmentsForManager([]);
      fetchManagerDepartments();
    } catch (error) {
      console.error('Error assigning departments:', error);
      alert('Error assigning departments');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, managerName: string, deptName: string) => {
    if (!confirm(`Remove department "${deptName}" from manager "${managerName}"?`)) return;

    try {
      const { error } = await supabase
        .from('manager_departments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      alert('Assignment removed successfully');
      fetchManagerDepartments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Error removing assignment');
    }
  };

  const toggleDepartmentSelection = (deptId: string) => {
    setSelectedDepartmentsForManager(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const getManagerDepartments = (managerId: string) => {
    return managerDepartments.filter(md => md.manager_id === managerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-600">Manage projects and departments</p>
        </div>
        <Settings className="w-8 h-8 text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-4 h-4" />
                <span>Projects</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'departments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Departments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manager-departments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manager-departments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Manager Departments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'forms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Forms</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <p className="text-sm text-gray-600">Manage organization projects</p>
              </div>
              <button
                onClick={handleAddProject}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 border rounded-lg ${
                    project.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Logo Preview */}
                      <div className="flex-shrink-0">
                        {project.logo_url ? (
                          <div className="relative group">
                            <img
                              src={project.logo_url}
                              alt={`${project.name} logo`}
                              className="w-16 h-16 object-contain border-2 border-gray-300 rounded-lg bg-white"
                            />
                            <button
                              onClick={() => handleLogoDelete(project)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700"
                              title="Remove logo"
                              disabled={uploadingLogo === project.id}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Project Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              project.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {/* Logo Upload Button */}
                        <div className="mt-2">
                          <label className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{project.logo_url ? 'Change Logo' : 'Upload Logo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleLogoUpload(project.id, file);
                                }
                                e.target.value = ''; // Reset input
                              }}
                              disabled={uploadingLogo === project.id}
                            />
                          </label>
                          {uploadingLogo === project.id && (
                            <span className="ml-2 text-xs text-gray-500">Uploading...</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: Square image, max 500KB (PNG, JPG, SVG)
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleProjectStatus(project)}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          project.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {project.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditProject(project)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FolderKanban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects yet. Click "Add Project" to create one.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
                <p className="text-sm text-gray-600">Manage organization departments</p>
              </div>
              <button
                onClick={handleAddDepartment}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>

            <div className="space-y-3">
              {departments.map((department) => (
                <div
                  key={department.id}
                  className={`p-4 border rounded-lg ${
                    department.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{department.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            department.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {department.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleDepartmentStatus(department)}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          department.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {department.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditDepartment(department)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id, department.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No departments yet. Click "Add Department" to create one.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manager Departments Tab */}
        {activeTab === 'manager-departments' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manager-Department Assignments</h2>
                <p className="text-sm text-gray-600">Assign departments to managers (many-to-many)</p>
              </div>
              <button
                onClick={handleOpenAssignModal}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Departments</span>
              </button>
            </div>

            {/* Group by Manager */}
            <div className="space-y-4">
              {managers.map((manager) => {
                const assignments = getManagerDepartments(manager.id);
                return (
                  <div key={manager.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{manager.full_name}</h3>
                          <p className="text-sm text-gray-600">{manager.employee_id}</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {assignments.length} Department{assignments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      {assignments.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No departments assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                            >
                              <Building2 className="w-4 h-4 text-green-700" />
                              <span className="text-sm font-medium text-green-900">
                                {assignment.department.name}
                              </span>
                              <button
                                onClick={() => handleRemoveAssignment(
                                  assignment.id,
                                  assignment.manager.full_name,
                                  assignment.department.name
                                )}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {managers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No managers available. Create managers first in User Management.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Form Access Management</h2>
              <p className="text-sm text-gray-600">Control which forms are available to each department</p>
            </div>

            <div className="space-y-6">
              {departments.map((department) => {
                const deptForms = departmentForms[department.id] || [];
                return (
                  <div key={department.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <span>{department.name}</span>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {deptForms.filter(f => f.is_enabled).length} of {deptForms.length} form(s) enabled
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          department.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {department.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {deptForms.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-4">
                          No forms available. Forms will be auto-assigned when created.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {deptForms.map((deptForm) => (
                            <div
                              key={deptForm.id}
                              className={`p-4 border rounded-lg transition-colors ${
                                deptForm.is_enabled 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <FileText className={`w-5 h-5 ${
                                      deptForm.is_enabled ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                    <div>
                                      <h4 className="font-medium text-gray-900">{deptForm.form.display_name}</h4>
                                      <p className="text-sm text-gray-600 mt-0.5">{deptForm.form.description}</p>
                                      <div className="flex items-center space-x-3 mt-2">
                                        <span className="text-xs text-gray-500">
                                          Form Type: <span className="font-medium">{deptForm.form.form_type}</span>
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                          deptForm.form.is_active 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {deptForm.form.is_active ? 'Form Active' : 'Form Inactive'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleToggleDepartmentForm(deptForm.id, deptForm.is_enabled)}
                                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                    deptForm.is_enabled
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                  }`}
                                  title={deptForm.is_enabled ? 'Click to disable' : 'Click to enable'}
                                >
                                  {deptForm.is_enabled ? (
                                    <>
                                      <ToggleRight className="w-5 h-5" />
                                      <span className="text-sm font-medium">Enabled</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-5 h-5" />
                                      <span className="text-sm font-medium">Disabled</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {departments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No departments available. Create departments first.</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">About Form Management</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Technicians can only access forms enabled for their department</li>
                    <li>• Currently, only "Service Report" form is available</li>
                    <li>• New forms will be automatically assigned to all departments</li>
                    <li>• Disable forms to prevent technicians from creating new reports of that type</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Departments to Manager Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Departments to Manager</h2>
            
            <div className="space-y-6">
              {/* Manager Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Manager *
                </label>
                <select
                  value={selectedManagerForDept}
                  onChange={(e) => setSelectedManagerForDept(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} - {manager.employee_id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Departments * (Multiple allowed)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartmentsForManager.includes(dept.id)}
                        onChange={() => toggleDepartmentSelection(dept.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{dept.name}</span>
                    </label>
                  ))}
                  {departments.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No departments available</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {selectedDepartmentsForManager.length} department(s)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedManagerForDept('');
                  setSelectedDepartmentsForManager([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDepartments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Departments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Smart City Project"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingProject ? 'Update' : 'Add'} Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., IT & Technology"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDepartment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingDepartment ? 'Update' : 'Add'} Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

