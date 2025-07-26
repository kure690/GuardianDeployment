import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import config from '../../config';

interface OpCenData {
  firstName: string;
  lastName: string;
  description: string;
  assignment: string;
  dateEstablished: Date;
  telNo: string;
  alternateNo: string;
  mobileNumber: string;
  email: string;
  website: string;
  shortHistory: string;
  profileImage: string;
  coverImage: string;
  markerImage: string;
  address: {
    coordinates: {
      lat: number;
      lng: number;
    }
  };
  socialMedia: {
    facebook: string;
    youtube: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

export const useOpCen = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<OpCenData>({
    queryKey: ['opcen', id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.GUARDIAN_SERVER_URL}/opcens/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    enabled: !!id, 
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000, 
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<OpCenData>) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${config.GUARDIAN_SERVER_URL}/opcens/${id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opcen', id] });
    },
  });

  return {
    ...query,
    updateMutation
  };
}; 