// client/src/pages/Taskforce/Applications.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../stores/authStore';
import applicationService from '../../services/application.service';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, RefreshCw, Filter, FileDown, Eye, CheckCircle, XCircle, 
  File, Link2, Calendar, Clock, Loader2, User, Briefcase, 
  Mail, Phone, MessageSquare, Download, Upload
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import TextArea from "@/components/ui/TextArea";
import { ScrollArea } from "@/components/ui/scroll-area";

const ApplicationDetails = ({ application, onApprove, onReject, onRequestSignature, onFinalApprove, onClose, isProcessing }) => {
  const [feedback, setFeedback] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [signedDocument, setSignedDocument] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const signedDocRef = useRef(null);

  // Initialize and track dark mode state
  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    const darkModeEnabled = savedTheme === 'dark' || document.documentElement.classList.contains('dark');
    setIsDarkMode(darkModeEnabled);

    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);  // Helper function to create download URL for uploaded files
  const getFileDownloadUrl = (filePath) => {
    if (!filePath) {
      return null;
    }
    
    // If it's already a full Supabase URL, return it as is
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // Convert backslashes to forward slashes and normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Remove leading slash if present
    const cleanPath = normalizedPath.replace(/^\/+/, '');
    
    // For legacy files that aren't Supabase URLs, construct API URL
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const fullUrl = `${apiBaseUrl}/${cleanPath}`;
    
    return fullUrl;
  };
    const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'awaiting':
        return <Badge className="bg-blue-500">Awaiting Signature</Badge>;
      case 'received':
        return <Badge className="bg-green-400">Document Received</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getApplicationTypeLabel = (type) => {
    switch (type) {
      case 'coach':
        return 'Fitness Coach';
      case 'affiliate':
        return 'Affiliate Partner';
      case 'taskforce':
        return 'Taskforce Member';
      case 'general':
        return 'General Employment';
      case 'support':
        return 'Support Request';
      default:
        return type;
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Basic validation
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB');
      return;
    }
    
    setSignedDocument(file);
  };
  
  return (
    <ScrollArea className="h-[80vh] pr-4">
      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {application.name}
            </h3>
            <p className="text-gray-500">{application.email}</p>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(application.status)}
            <span className="text-sm text-gray-500 mt-1">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              {formatDate(application.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Application details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Application Type:</span>
              <span className="text-sm">{getApplicationTypeLabel(application.applicationType)}</span>
            </div>
            
            {application.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{application.phone}</span>
              </div>
            )}
            
            {application.portfolioUrl && (
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Portfolio/LinkedIn:</span>
                <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                  {application.portfolioUrl}
                </a>
              </div>
            )}            {application.resume && (
              <div className={`relative p-4 rounded-lg border-2 border-dashed transition-all duration-200 hover:border-blue-400 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 hover:bg-gray-750' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      isDarkMode ? 'bg-blue-600' : 'bg-blue-100'
                    }`}>
                      <File className={`h-5 w-5 ${
                        isDarkMode ? 'text-white' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Resume Document
                      </span>
                    </div>
                  </div>
                  <a 
                    href={getFileDownloadUrl(application.resume)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                    }`}
                    download
                    onClick={() => {
                      // Resume download
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>
                
                {/* Decorative elements */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  isDarkMode ? 'bg-green-400' : 'bg-green-500'
                }`}></div>
        
              </div>
            )}
            
            {!application.resume && (
              <div className={`relative p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <File className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      No Resume Document
                    </span>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No resume was uploaded with this application
                    </span>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                }`}></div>
                <div className={`absolute bottom-2 left-2 text-xs font-medium ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  ! Missing
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Applied:</span>
              <span className="text-sm">{formatDate(application.createdAt)}</span>
            </div>
            
            {application.reviewedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Reviewed:</span>
                <span className="text-sm">{formatDate(application.reviewedAt)}</span>
              </div>
            )}
            
            {application.reviewedBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Reviewed By:</span>
                <span className="text-sm">{application.reviewedBy.firstName} {application.reviewedBy.lastName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Message content */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            Message
          </h4>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {application.message}
          </div>
        </div>
        
        {/* Feedback if already reviewed */}
        {application.feedback && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              Feedback
            </h4>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {application.feedback}
            </div>
          </div>
        )}
        
        {/* Action buttons based on current status */}
        {application.status === 'pending' && (
          <div className="space-y-4">
            <h4 className="font-medium">Review Application</h4>
            <TextArea
              placeholder="Add feedback or notes about this application..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectConfirm(true)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              
              <Button 
                onClick={() => onRequestSignature(application._id, feedback)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <File className="h-4 w-4 mr-2" />
                    Request Signature
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {application.status === 'awaiting' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Document Status
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Documents were sent for signature on {formatDate(application.documentSentAt || application.updatedAt)}.
                {application.signedDocumentPath ? 
                  ' Signed document has been received.' : 
                  ' Waiting for the applicant to return signed documents.'}
              </p>
            </div>
              {application.signedDocumentPath ? (              
              // Show signed document and option to approve
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {application.additionalDocuments?.length > 1 
                      ? `Signed Documents Received (${application.additionalDocuments.length})`
                      : 'Signed Document Received'
                    }
                  </h4>
                </div>

                {/* Display all documents */}
                {application.additionalDocuments?.length > 0 ? (
                  <div className="space-y-3">
                    {application.additionalDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <File className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • 
                              {doc.uploadedAt ? formatDate(doc.uploadedAt) : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={getFileDownloadUrl(doc.path)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="text-sm">View</span>
                          </a>
                          <a 
                            href={getFileDownloadUrl(doc.path)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 flex items-center gap-1 hover:text-gray-800 transition-colors"
                            download
                          >
                            <Download className="h-3 w-3" />
                            <span className="text-sm">Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback to single document display for backward compatibility
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <File className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Signed Document</p>
                        <p className="text-xs text-gray-500">Legacy format</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={getFileDownloadUrl(application.signedDocumentPath)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Document</span>
                      </a>
                      <a 
                        href={getFileDownloadUrl(application.signedDocumentPath)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 flex items-center gap-1 hover:text-gray-800 transition-colors"
                        download
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}
                
                <TextArea
                  placeholder="Add final approval notes..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  <Button 
                    onClick={() => onFinalApprove(application._id, feedback)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Final Approval
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Option to upload signed document manually
              <div className="space-y-4">
                <h4 className="font-medium">Upload Signed Document</h4>
                <p className="text-sm text-gray-600">
                  If you've received the signed document via email, you can upload it here.
                </p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={signedDocRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signedDocRef.current.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  <span className="text-sm text-gray-500">
                    {signedDocument ? signedDocument.name : 'No file chosen'}
                  </span>
                </div>
                
                {signedDocument && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => onUploadSignedDocument(application._id, signedDocument)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <File className="h-4 w-4 mr-2" />
                          Submit Document
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>        )}
        
        {application.status === 'received' && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-md">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Document Received
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Signed documents have been received{application.signedDocumentReceivedAt ? 
                  ` on ${formatDate(application.signedDocumentReceivedAt)}` : 
                  ''}. Review the documents and provide final approval or rejection.
              </p>
            </div>            {application.signedDocumentPath && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {application.additionalDocuments?.length > 1 
                      ? `Signed Documents (${application.additionalDocuments.length})`
                      : 'Signed Document'
                    }
                  </h4>
                </div>

                {application.additionalDocuments?.length > 0 ? (
                  <div className="space-y-3">
                    {application.additionalDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <File className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • 
                              {doc.uploadedAt ? formatDate(doc.uploadedAt) : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={getFileDownloadUrl(doc.path)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="text-sm">View</span>
                          </a>
                          <a 
                            href={getFileDownloadUrl(doc.path)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 flex items-center gap-1 hover:text-gray-800 transition-colors"
                            download
                          >
                            <Download className="h-3 w-3" />
                            <span className="text-sm">Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback to single document display for backward compatibility
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <File className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Signed Document</p>
                        <p className="text-xs text-gray-500">Legacy format</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={getFileDownloadUrl(application.signedDocumentPath)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </a>
                      <a 
                        href={getFileDownloadUrl(application.signedDocumentPath)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 flex items-center gap-1 hover:text-gray-800 transition-colors"
                        download
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}
                
                <TextArea
                  placeholder="Add final approval notes or rejection reason..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  <Button 
                    onClick={() => onFinalApprove(application._id, feedback)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Final Approval
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Rejection confirmation */}
        <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this application? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setShowRejectConfirm(false);
                  onReject(application._id, feedback);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
};

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  // Initialize and track dark mode state
  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    const darkModeEnabled = savedTheme === 'dark' || document.documentElement.classList.contains('dark');
    setIsDarkMode(darkModeEnabled);

    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let result = [...applications];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app => 
        app.name.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        app.message.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }
  
    if (typeFilter !== 'all') {
      result = result.filter(app => app.applicationType === typeFilter);
    }
    
    setFilteredApplications(result);
  }, [applications, searchTerm, statusFilter, typeFilter]);
  const fetchApplications = async () => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      setLoading(false);
      return;
    }
      try {
      setLoading(true);
      const response = await applicationService.getApplications({ 
        excludeType: 'support' 
      });      
      const apps = response.data || [];
      
      // Filter out any migrated applications if they exist
      const activeApps = apps.filter(app => app.status !== 'migrated');
      
      setApplications(activeApps);
      setFilteredApplications(activeApps);
        // Calculate stats with the updated list
      const stats = {
        pending: activeApps.filter(app => app.status === 'pending').length,
        awaiting: activeApps.filter(app => app.status === 'awaiting').length,
        received: activeApps.filter(app => app.status === 'received').length,
        approved: activeApps.filter(app => app.status === 'approved').length,
        rejected: activeApps.filter(app => app.status === 'rejected').length,
        total: activeApps.length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetails(true);
  };

  const handleApproveApplication = async (id, feedback) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can approve applications.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await applicationService.updateApplicationStatus(id, 'approved', feedback);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app._id === id ? { ...app, status: 'approved', feedback, reviewedAt: new Date(), reviewedBy: user } : app)
      );
      
      setShowDetails(false);
      toast.success('Application approved successfully');
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async (id, feedback) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can reject applications.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await applicationService.updateApplicationStatus(id, 'rejected', feedback);

      setApplications(prev => 
        prev.map(app => app._id === id ? { ...app, status: 'rejected', feedback, reviewedAt: new Date(), reviewedBy: user } : app)
      );
      
      setShowDetails(false);
      toast.success('Application rejected successfully');
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestSignature = async (id, feedback) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can approve applications.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await applicationService.updateApplicationStatus(id, 'awaiting', feedback);
      
      setApplications(prev => 
        prev.map(app => app._id === id ? { 
          ...app, 
          status: 'awaiting',
          feedback,
          reviewedAt: new Date(),
          reviewedBy: user,
          documentSent: true,
          documentSentAt: new Date()
        } : app)
      );
      
      setShowDetails(false);
      toast.success('Document sent for signing successfully');
    } catch (error) {
      console.error('Error requesting signature:', error);
      toast.error('Failed to send document for signing');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFinalApprove = async (id, feedback) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can give final approval.');
      return;
    }
    
    try {
      setIsProcessing(true);
      // Final approval (status = approved)
      const response = await applicationService.updateApplicationStatus(id, 'approved', feedback);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app._id === id ? { 
          ...app, 
          status: 'approved',
          feedback,
          reviewedAt: new Date(),
          reviewedBy: user
        } : app)
      );
      
      setShowDetails(false);
      toast.success('Application fully approved and user role updated');
    } catch (error) {
      console.error('Error giving final approval:', error);
      toast.error('Failed to give final approval');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUploadSignedDocument = async (id, file) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can upload documents.');
      return;
    }
    
    try {
      setIsProcessing(true);
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('signedDocument', file);
      
      const response = await applicationService.uploadSignedDocument(id, formData);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app._id === id ? { 
          ...app, 
          signedDocumentPath: response.data.signedDocumentPath,
          signedDocumentReceivedAt: new Date()
        } : app)
      );
      
      toast.success('Signed document uploaded successfully');
      
      // Refresh the application details
      const updatedApp = await applicationService.getApplicationById(id);
      setSelectedApplication(updatedApp.data);
    } catch (error) {
      console.error('Error uploading signed document:', error);
      toast.error('Failed to upload signed document');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportApplicationsCSV = () => {
    // Generate CSV content
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Status', 'Date Applied', 'Message'];
    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(app => [
        `"${app.name.replace(/"/g, '""')}"`,
        `"${app.email.replace(/"/g, '""')}"`,
        app.phone ? `"${app.phone.replace(/"/g, '""')}"` : '',
        app.applicationType,
        app.status,
        new Date(app.createdAt).toLocaleDateString(),
        `"${app.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ].join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `applications-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'awaiting':
        return <Badge className="bg-blue-500">Awaiting Signature</Badge>;
      case 'received':
        return <Badge className="bg-green-400">Document Received</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getApplicationTypeLabel = (type) => {
    switch (type) {
      case 'coach':
        return 'Fitness Coach';
      case 'affiliate':
        return 'Affiliate Partner';
      case 'taskforce':
        return 'Taskforce Member';
      case 'general':
        return 'General Employment';
      case 'support':
        return 'Support Request';
      default:
        return type;
    }
  };

  if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have permission to view this page. Only Taskforce members and administrators can access the applications dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Applications</h2>
          <p className={`mt-1 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Manage and review incoming applications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchApplications}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={exportApplicationsCSV}
            variant="outline" 
            className="gap-2"
            size="sm"
            disabled={filteredApplications.length === 0}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total</span>
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Pending</span>
            <span className="text-2xl font-bold text-yellow-500">{stats.pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Awaiting</span>
            <span className="text-2xl font-bold text-blue-500">{stats.awaiting}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Received</span>
            <span className="text-2xl font-bold text-green-400">{stats.received}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Approved</span>
            <span className="text-2xl font-bold text-green-600">{stats.approved}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Rejected</span>
            <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
          </CardContent>
        </Card>
      </div>

      <Card>        <CardHeader className="pb-2">
          <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Applications</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
            Review and manage all applications submitted through the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="md:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-1 gap-4">              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="awaiting">Awaiting Signature</SelectItem>
                  <SelectItem value="received">Document Received</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="coach">Fitness Coach</SelectItem>
                  <SelectItem value="affiliate">Affiliate Partner</SelectItem>
                  <SelectItem value="taskforce">Taskforce Member</SelectItem>
                  <SelectItem value="general">General Employment</SelectItem>
                  <SelectItem value="support">Support Request</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="px-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Applications Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <File className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No applications found</h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {applications.length > 0 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'There are no applications submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>                <TableHeader>
                  <TableRow>
                    <TableHead className={`w-[200px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Type</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Date</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Status</TableHead>
                    <TableHead className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</TableHead>
                  </TableRow>
                </TableHeader><TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application._id} className={`${application.status === 'pending' ? (isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50') : ''} ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      <TableCell className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        <div>{application.name}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{application.email}</div>
                      </TableCell>
                      <TableCell className={isDarkMode ? 'text-white' : 'text-black'}>{getApplicationTypeLabel(application.applicationType)}</TableCell>
                      <TableCell className={isDarkMode ? 'text-white' : 'text-black'}>{formatDate(application.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={showDetails && selectedApplication?._id === application._id} onOpenChange={setShowDetails}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(application)}
                              className="bg-blue-400 "
                            >
                              <Eye className="h-4 w-4 mr-1 " />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] z-50">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Application from {application.name} for {getApplicationTypeLabel(application.applicationType)}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedApplication && (
                              <ApplicationDetails
                                application={selectedApplication}
                                onApprove={handleApproveApplication}
                                onRequestSignature={handleRequestSignature}
                                onFinalApprove={handleFinalApprove}
                                onUploadSignedDocument={handleUploadSignedDocument}
                                onReject={handleRejectApplication}
                                onClose={() => setShowDetails(false)}
                                isProcessing={isProcessing}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Applications;