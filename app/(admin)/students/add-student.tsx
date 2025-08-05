import { auth, db } from '@/firebaseConfig';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, writeBatch } from 'firebase/firestore';
import React, { useCallback, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { z } from 'zod';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const guardianSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  relationship: z.enum(['Parent', 'Guardian', 'Other']),
  isPrimary: z.boolean(),
  profileImage: z.string().nullable().optional(),
});

const studentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  className: z.string().min(1, "Class is required"),
  studentId: z.string().optional(),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  profileImage: z.string().optional(),
  guardians: z.array(guardianSchema).min(1, "At least one guardian is required"),
});

type Guardian = z.infer<typeof guardianSchema>;
type StudentFormData = z.infer<typeof studentSchema>;

interface Step {
  title: string;
  icon: string;
  fields: (keyof StudentFormData)[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS: Step[] = [
  { title: 'Student', icon: '👤', fields: ['fullName', 'className', 'dateOfBirth'] },
  { title: 'Guardians', icon: '👨‍👩‍👧', fields: ['guardians'] },
  { title: 'Review', icon: '📄', fields: [] },
];

const RELATIONSHIP_OPTIONS = ['Parent', 'Guardian', 'Other'] as const;
const MAX_GUARDIANS = 6;
const MAX_PRIMARY_GUARDIANS = 2;
const DEFAULT_PASSWORD = '123456';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = (): string => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateStudentId = (): string => `SID${Date.now()}`;

const generateGuardianAuthEmail = (guardianName: string, studentId: string): string => {
    const nameParts = guardianName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || 'user';
    const sanitizedLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${sanitizedLastName}-${studentId}@student-id.app`;
};

// ============================================================================
// HOOKS
// ============================================================================

const useImagePicker = () => {
  const [uploading, setUploading] = useState<string | null>(null);

  const pickImage = useCallback(async (uploadId: string): Promise<string | null> => {
    setUploading(uploadId);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return null;
      return result.assets[0].uri;
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image.');
      return null;
    } finally {
      setUploading(null);
    }
  }, []);

  return { pickImage, uploading };
};

const useFormValidation = (schema: typeof studentSchema) => {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      className: '',
      studentId: '',
      dateOfBirth: undefined,
      profileImage: '',
      guardians: [],
    },
  });

  const guardianFields = useFieldArray({
    control: form.control,
    name: 'guardians',
  });

  const validateStep = useCallback(async (step: number): Promise<boolean> => {
    const fieldsToValidate = STEPS[step]?.fields || [];
    if (fieldsToValidate.length === 0) return true;

    const result = await form.trigger(fieldsToValidate);
    if (!result) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
    }
    return result;
  }, [form.trigger]);

  return { form, guardianFields, validateStep };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AddStudentScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedGuardianId, setExpandedGuardianId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    studentName: string;
    studentId: string;
    date: Date;
  } | null>(null);

  const { form, guardianFields, validateStep } = useFormValidation(studentSchema);
  const { pickImage, uploading } = useImagePicker();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const resetFormForNewStudent = useCallback(() => {
    const defaultGuardianId = generateId();
    form.reset({
      fullName: '',
      className: '',
      studentId: '',
      dateOfBirth: undefined,
      profileImage: '',
      guardians: [{
        id: defaultGuardianId,
        fullName: '',
        phoneNumber: '',
        email: '',
        relationship: 'Parent',
        isPrimary: true,
        profileImage: null,
      }],
    });
    setCurrentStep(0);
    setExpandedGuardianId(defaultGuardianId);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [form]);

  useFocusEffect(
    useCallback(() => {
      resetFormForNewStudent();
    }, [resetFormForNewStudent])
  );

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < STEPS.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      form.handleSubmit(handleSubmit)();
    }
  }, [currentStep, validateStep, form.handleSubmit]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleImagePick = useCallback(async (type: 'student' | 'guardian', guardianIndex?: number) => {
    const uploadId = type === 'student' ? 'student' : `guardian_${guardianIndex}`;
    const imageUri = await pickImage(uploadId);
    
    if (imageUri) {
      if (type === 'student') {
        form.setValue('profileImage', imageUri, { shouldValidate: true });
      } else if (guardianIndex !== undefined) {
        const currentGuardian = guardianFields.fields[guardianIndex];
        guardianFields.update(guardianIndex, {
          ...currentGuardian,
          profileImage: imageUri,
        });
      }
    }
  }, [pickImage, form.setValue, guardianFields]);

  const handleDateSelect = useCallback((date: Date) => {
    form.setValue('dateOfBirth', date, { shouldValidate: true });
    setShowDatePicker(false);
  }, [form.setValue]);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetFormForNewStudent();
  };

  const addGuardian = useCallback(() => {
    if (guardianFields.fields.length >= MAX_GUARDIANS) {
      Alert.alert('Limit Reached', `Maximum ${MAX_GUARDIANS} guardians allowed.`);
      return;
    }
    const newId = generateId();
    guardianFields.append({
      id: newId,
      fullName: '',
      phoneNumber: '',
      email: '',
      relationship: 'Parent',
      isPrimary: false,
      profileImage: null,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGuardianId(newId);
  }, [guardianFields]);

  const removeGuardian = useCallback((index: number) => {
    if (guardianFields.fields.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one guardian is required.');
      return;
    }
    Alert.alert(
      'Remove Guardian',
      'Are you sure you want to remove this guardian?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            guardianFields.remove(index);
            setExpandedGuardianId(null);
          },
        },
      ]
    );
  }, [guardianFields]);

  const togglePrimaryGuardian = useCallback((index: number) => {
    const guardians = form.getValues('guardians');
    const currentGuardian = guardians[index];
    const primaryCount = guardians.filter(g => g.isPrimary).length;

    if (currentGuardian.isPrimary) {
      guardianFields.update(index, { ...currentGuardian, isPrimary: false });
    } else if (primaryCount < MAX_PRIMARY_GUARDIANS) {
      guardianFields.update(index, { ...currentGuardian, isPrimary: true });
    } else {
      Alert.alert('Limit Reached', `Maximum ${MAX_PRIMARY_GUARDIANS} primary guardians allowed.`);
    }
  }, [form.getValues, guardianFields]);

  // ============================================================================
  // FORM SUBMISSION (UPDATED LOGIC)
  // ============================================================================

  const handleSubmit = useCallback(async (data: StudentFormData) => {
    setIsSubmitting(true);
    const finalStudentId = data.studentId || generateStudentId();
  
    // Create a new document reference for the student in the 'students' collection.
    // This allows us to get the document ID before we commit the data.
    const studentDocRef = doc(collection(db, 'students'));
  
    try {
      // Use a batch to write all data at once. This is more efficient and ensures
      // that either all data is saved, or none of it is.
      const batch = writeBatch(db);
  
      // --- Process Guardians ---
      for (const guardian of data.guardians) {
        const authEmail = generateGuardianAuthEmail(guardian.fullName, finalStudentId);
        const communicationEmail = guardian.email;
  
        // Create the Firebase Auth user. This part cannot be batched.
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, DEFAULT_PASSWORD);
        const guardianUid = userCredential.user.uid;
  
        // Define the reference to the new guardian document inside the student's 'guardians' subcollection.
        const guardianDocRef = doc(db, 'students', studentDocRef.id, 'guardians', guardianUid);
  
        // Add the operation to the batch.
        batch.set(guardianDocRef, {
          fullName: guardian.fullName,
          authEmail: authEmail,
          email: communicationEmail || '',
          phoneNumber: guardian.phoneNumber,
          role: 'parent',
          relationship: guardian.relationship,
          isPrimary: guardian.isPrimary,
          createdAt: new Date(),
          profileImageLocalUri: guardian.profileImage || '',
        });
      }
  
      // --- Prepare and Save Student Profile ---
      // Add the student document creation to the batch.
      batch.set(studentDocRef, {
        fullName: data.fullName,
        className: data.className,
        studentId: finalStudentId,
        dateOfBirth: data.dateOfBirth.toISOString(),
        createdAt: new Date(),
        profileImageLocalUri: data.profileImage || '',
        // The guardianUids array is no longer needed with this nested structure.
      });
  
      // Commit the batch to save all Firestore data at once.
      await batch.commit();
  
      console.log('Student profile and nested guardians saved successfully!');
  
      // --- Show Success ---
      setSubmissionResult({
        studentName: data.fullName,
        studentId: finalStudentId,
        date: new Date(),
      });
      setShowSuccessModal(true);
  
    } catch (error: any) {
      console.error('Form submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {STEPS.map((step, index) => (
        <React.Fragment key={index}>
          <TouchableOpacity
            style={styles.stepItem}
            onPress={() => index < currentStep && setCurrentStep(index)}
            disabled={index >= currentStep}
          >
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
              index < currentStep && styles.stepCircleCompleted,
            ]}>
              <Text style={[
                styles.stepIcon,
                index <= currentStep && styles.stepIconActive,
              ]}>
                {index < currentStep ? '✓' : step.icon}
              </Text>
            </View>
            <Text style={[
              styles.stepTitle,
              index <= currentStep && styles.stepTitleActive,
            ]}>
              {step.title}
            </Text>
          </TouchableOpacity>
          {index < STEPS.length - 1 && (
            <View style={[
              styles.stepConnector,
              index < currentStep && styles.stepConnectorActive,
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderPhotoUploader = (
    image: string | null | undefined,
    onPress: () => void,
    isUploading: boolean,
    size: 'large' | 'small' = 'large'
  ) => {
    const containerStyle = size === 'large' ? styles.photoContainer : styles.photoContainerSmall;
    const imageStyle = size === 'large' ? styles.photoImage : styles.photoImageSmall;
    const placeholderStyle = size === 'large' ? styles.photoPlaceholder : styles.photoPlaceholderSmall;

    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} disabled={isUploading}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={imageStyle} />
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>✓</Text>
            </View>
          </>
        ) : (
          <View style={placeholderStyle}>
            {isUploading ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <>
                <Text style={styles.photoPlaceholderIcon}>📷</Text>
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFormInput = (
    name: keyof StudentFormData | `guardians.${number}.${keyof Guardian}`,
    placeholder: string,
    options: any = {}
  ) => (
    <View style={styles.inputContainer}>
      <Controller
        control={form.control}
        name={name as any}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder={placeholder}
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor="#94A3B8"
              {...options}
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </>
        )}
      />
    </View>
  );

  const renderStudentForm = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Student Information</Text>
      <Text style={styles.sectionSubtitle}>
        Add the student's basic information and photo.
      </Text>

      <Controller
        control={form.control}
        name="profileImage"
        render={({ field: { value } }) => (
          <View style={styles.inputContainer}>
            {renderPhotoUploader(
              value,
              () => handleImagePick('student'),
              uploading === 'student'
            )}
          </View>
        )}
      />

      {renderFormInput('fullName', 'Full Name *')}
      {renderFormInput('className', 'Class (e.g., 10A) *')}
      {renderFormInput('studentId', 'Student ID (Optional, will be generated if blank)')}

      <Controller
        control={form.control}
        name="dateOfBirth"
        render={({ field: { value }, fieldState: { error } }) => (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, error && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={value ? styles.dateText : styles.datePlaceholder}>
                {value ? value.toLocaleDateString() : 'Date of Birth *'}
              </Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />
    </View>
  );

  const renderGuardianCard = (guardian: Guardian, index: number) => {
    const isExpanded = guardian.id === expandedGuardianId;
    const canRemove = guardianFields.fields.length > 1;

    if (!isExpanded) {
      return (
        <TouchableOpacity
          key={guardian.id}
          style={styles.guardianCardCollapsed}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpandedGuardianId(guardian.id);
          }}
        >
          <View style={styles.guardianCardCollapsedContent}>
            <View style={styles.guardianCardCollapsedLeft}>
              {guardian.profileImage ? (
                <Image source={{ uri: guardian.profileImage }} style={styles.guardianAvatarSmall} />
              ) : (
                <View style={styles.guardianAvatarPlaceholderSmall} />
              )}
              <Text style={styles.guardianCardCollapsedName}>
                {guardian.fullName || `Guardian ${index + 1}`}
              </Text>
            </View>
            <View style={styles.guardianCardCollapsedRight}>
              {guardian.isPrimary && (
                <View style={styles.primaryBadgeSmall}>
                  <Text style={styles.primaryBadgeSmallText}>Primary</Text>
                </View>
              )}
              <Text style={styles.expandIcon}>▼</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View key={guardian.id} style={styles.guardianCardExpanded}>
        <TouchableOpacity
          style={styles.guardianCardHeader}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpandedGuardianId(null);
          }}
        >
          <Text style={styles.guardianCardTitle}>Guardian {index + 1}</Text>
          <Text style={styles.expandIcon}>▲</Text>
        </TouchableOpacity>

        <Controller
          control={form.control}
          name={`guardians.${index}.profileImage`}
          render={({ field: { value } }) => (
            <View style={styles.inputContainer}>
              {renderPhotoUploader(
                value,
                () => handleImagePick('guardian', index),
                uploading === `guardian_${index}`,
                'small'
              )}
            </View>
          )}
        />

        {renderFormInput(`guardians.${index}.fullName`, 'Full Name *')}
        {renderFormInput(`guardians.${index}.phoneNumber`, 'Phone Number *', {
          keyboardType: 'phone-pad',
        })}
        {renderFormInput(`guardians.${index}.email`, 'Contact Email (Optional)', {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
        })}

        <Controller
          control={form.control}
          name={`guardians.${index}.relationship`}
          render={({ field: { onChange, value } }) => (
            <View style={styles.relationshipContainer}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.relationshipButton,
                    value === option && styles.relationshipButtonActive,
                  ]}
                  onPress={() => onChange(option)}
                >
                  <Text
                    style={[
                      styles.relationshipButtonText,
                      value === option && styles.relationshipButtonTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <View style={styles.guardianCardActions}>
          <TouchableOpacity
            onPress={() => togglePrimaryGuardian(index)}
            style={styles.primaryToggle}
          >
            <Text
              style={[
                styles.primaryToggleText,
                guardian.isPrimary && styles.primaryToggleTextActive,
              ]}
            >
              {guardian.isPrimary ? '✓ Primary' : 'Set as Primary'}
            </Text>
          </TouchableOpacity>

          {canRemove && (
            <TouchableOpacity
              onPress={() => removeGuardian(index)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderGuardiansForm = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Guardian Information</Text>
      <Text style={styles.sectionSubtitle}>
        Add up to {MAX_GUARDIANS} guardians. An account will be created for each with a default password.
      </Text>

      {guardianFields.fields.map((field, index) => renderGuardianCard(field, index))}

      {guardianFields.fields.length < MAX_GUARDIANS && (
        <TouchableOpacity style={styles.addGuardianButton} onPress={addGuardian}>
          <Text style={styles.addGuardianButtonText}>+ Add Another Guardian</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderReviewForm = () => {
    const data = form.getValues();
    const validGuardians = data.guardians.filter(g => g.fullName && g.phoneNumber);

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Review & Confirm</Text>
        <Text style={styles.sectionSubtitle}>
          Please review all information before creating the accounts.
        </Text>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Student</Text>
          <View style={styles.reviewItem}>
            {data.profileImage && (
              <Image source={{ uri: data.profileImage }} style={styles.reviewAvatar} />
            )}
            <View style={styles.reviewItemContent}>
              <Text style={styles.reviewItemName}>{data.fullName}</Text>
              <Text style={styles.reviewItemDetail}>Class: {data.className}</Text>
              {data.studentId && (
                <Text style={styles.reviewItemDetail}>ID: {data.studentId}</Text>
              )}
              {data.dateOfBirth && (
                <Text style={styles.reviewItemDetail}>
                  DOB: {data.dateOfBirth.toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>
            Guardians ({validGuardians.length})
          </Text>
          {validGuardians.map((guardian, index) => (
            <View
              key={guardian.id}
              style={[
                styles.reviewItem,
                index < validGuardians.length - 1 && styles.reviewItemBorder,
              ]}
            >
              {guardian.profileImage ? (
                <Image source={{ uri: guardian.profileImage }} style={styles.reviewAvatar} />
              ) : (
                <View style={styles.reviewAvatarPlaceholder} />
              )}
              <View style={styles.reviewItemContent}>
                <Text style={styles.reviewItemName}>
                  {guardian.fullName}
                  {guardian.isPrimary && (
                    <Text style={styles.primaryBadgeInline}> (Primary)</Text>
                  )}
                </Text>
                <Text style={styles.reviewItemDetail}>{guardian.phoneNumber}</Text>
                <Text style={styles.reviewItemDetail}>{guardian.email || 'No contact email'}</Text>
                <Text style={styles.reviewItemDetail}>{guardian.relationship}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      {currentStep > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isSubmitting}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[
          styles.nextButton,
          currentStep === 0 && styles.nextButtonFullWidth,
          currentStep === STEPS.length - 1 && styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleNext}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.nextButtonText}>
            {currentStep === STEPS.length - 1 ? 'Submit & Create Accounts' : 'Next'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={handleCloseSuccessModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalIconContainer}>
            <Text style={styles.modalIcon}>✅</Text>
          </View>
          
          <Text style={styles.modalTitle}>Success!</Text>
          <Text style={styles.modalMessage}>
            Student profile and guardian accounts have been created successfully.
          </Text>

          {submissionResult && (
            <View style={styles.modalDetails}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Student:</Text>
                <Text style={styles.modalDetailValue}>{submissionResult.studentName}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>ID:</Text>
                <Text style={styles.modalDetailValue}>{submissionResult.studentId}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Created:</Text>
                <Text style={styles.modalDetailValue}>
                  {submissionResult.date.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleCloseSuccessModal}
          >
            <Text style={styles.modalButtonText}>Add Another Student</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add New Student',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepIndicator()}
          
          <View style={styles.formContainer}>
            {currentStep === 0 && renderStudentForm()}
            {currentStep === 1 && renderGuardiansForm()}
            {currentStep === 2 && renderReviewForm()}
            
            {renderActionButtons()}
          </View>
        </ScrollView>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateSelect}
          onCancel={() => setShowDatePicker(false)}
          maximumDate={new Date()}
        />

        {renderSuccessModal()}
      </KeyboardAvoidingView>
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#4F46E5',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepIcon: {
    fontSize: 16,
    color: '#64748B',
  },
  stepIconActive: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  stepTitleActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  stepConnector: {
    height: 2,
    backgroundColor: '#E2E8F0',
    flex: 1,
    marginHorizontal: -8,
    position: 'relative',
    bottom: 15,
  },
  stepConnectorActive: {
    backgroundColor: '#4F46E5',
  },

  // Form Container
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Section Headers
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Photo Uploader
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainerSmall: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoImageSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: {
    fontSize: 24,
    color: '#94A3B8',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Form Inputs
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#1E293B',
  },
  datePlaceholder: {
    color: '#94A3B8',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Guardian Cards
  guardianCardCollapsed: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guardianCardCollapsedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardianCardCollapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guardianCardCollapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardianCardCollapsedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  guardianAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  guardianAvatarPlaceholderSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  primaryBadgeSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  primaryBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 16,
    color: '#94A3B8',
  },

  guardianCardExpanded: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guardianCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  guardianCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Relationship Buttons
  relationshipContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  relationshipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relationshipButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  relationshipButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  relationshipButtonTextActive: {
    color: '#FFFFFF',
  },

  // Guardian Actions
  guardianCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryToggle: {
    padding: 8,
  },
  primaryToggleText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryToggleTextActive: {
    color: '#10B981',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },

  // Add Guardian Button
  addGuardianButton: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  addGuardianButtonText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 16,
  },

  // Review Section
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
    paddingBottom: 16,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  reviewAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  reviewItemContent: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  reviewItemDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 1,
  },
  primaryBadgeInline: {
    color: '#10B981',
    fontWeight: '500',
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});