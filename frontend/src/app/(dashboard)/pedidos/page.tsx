'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, Badge, Spinner, Modal } from '@/components/ui';
import { ShoppingCart, Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { usePedidos, useDeletePedido } from '@/hooks/usePedidos';
import { Pedido } from '@/types';
import { PedidoForm } from './PedidoForm';

export default function PedidosPage() {
  const { data: pedidos, isLoading, error } = usePedidos();
  const deletePedido = useDeletePedido();
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [pedidoToEdit, setPedidoToEdit] = useState<Pedido | null>(null);

  const handleEditPedido = (pedido: Pedido) => {
    setPedidoToEdit(pedido);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setIsDeleteOpen(true);
  };

  const handlePayClick = (pedido: Pedido) => {
    // Redirigir a la página de pagos con los datos del pedido
    router.push(`/pagos?pedidoId=${pedido.id}&monto=${pedido.total}`);
  };

  const handleConfirmDelete = async () => {
    if (selectedPedido) {
      try {
        await deletePedido.mutateAsync(selectedPedido.id);
        setIsDeleteOpen(false);
        setSelectedPedido(null);
      } catch (err) {
        console.error('Error al eliminar pedido:', err);
      }
    }
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    setPedidoToEdit(null);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
      case 'entregado':
        return <Badge variant="success">Completado</Badge>;
      case 'pagado':
        return <Badge variant="success">Pagado</Badge>;
      case 'pendiente':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'en proceso':
      case 'en_proceso':
        return <Badge variant="info">En Proceso</Badge>;
      case 'cancelado':
        return <Badge variant="danger">Cancelado</Badge>;
      case 'pago_fallido':
        return <Badge variant="danger">Pago Fallido</Badge>;
      case 'reembolsado':
        return <Badge variant="warning">Reembolsado</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      header: 'ID',
      accessor: (row: Pedido) => <span className="font-medium">#{row.id}</span>,
    },
    {
      header: 'Fecha',
      accessor: (row: Pedido) => formatDate(row.fecha),
    },
    {
      header: 'Cliente ID',
      accessor: 'clienteId' as keyof Pedido,
    },
    {
      header: 'Total',
      accessor: (row: Pedido) => (
        <span className="font-semibold">{formatCurrency(Number(row.total))}</span>
      ),
    },
    {
      header: 'Estado',
      accessor: (row: Pedido) => getEstadoBadge(row.estado),
    },
    {
      header: 'Acciones',
      accessor: (row: Pedido) => (
        <div className="flex gap-2">
          {/* Botón de Pago - solo para pedidos pendientes */}
          {row.estado?.toLowerCase() === 'pendiente' && (
            <Button 
              variant="primary" 
              size="sm" 
              title="Pagar pedido"
              onClick={() => handlePayClick(row)}
              className="bg-green-500 hover:bg-green-600"
            >
              <CreditCard size={16} />
            </Button>
          )}
          <Button 
            variant="secondary" 
            size="sm" 
            title="Editar pedido"
            onClick={() => handleEditPedido(row)}
          >
            <Pencil size={16} />
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            title="Eliminar pedido"
            onClick={() => handleDeleteClick(row)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <Card>
          <div className="text-center py-12 text-red-500">
            Error al cargar los pedidos: {(error as Error).message}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {pedidos && pedidos.length > 0 ? (
        <Card>
          <Table data={pedidos} columns={columns} />
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay pedidos
            </h3>
            <p className="text-gray-500 mb-4">
              Aún no se han registrado pedidos en el sistema
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              Crear Primer Pedido
            </Button>
          </div>
        </Card>
      )}

      {/* Modal para crear/editar pedido */}
      <PedidoForm
        isOpen={isModalOpen}
        onClose={handleCloseForm}
        pedidoToEdit={pedidoToEdit}
      />

      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Pedido"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el pedido{' '}
            <span className="font-semibold">#{selectedPedido?.id}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          
          {deletePedido.error && (
            <div className="text-red-500 text-sm">
              Error: {(deletePedido.error as Error).message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={deletePedido.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
