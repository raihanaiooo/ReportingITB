<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticketing', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users');
            $table->string('requester_name');
            $table->string('subject');
            $table->enum('assign', ['administrator', 'Ami Nellasari', 'Ario Sutomo', 'Helpdesk DTI', 'Iwan Setiawan', 'Manager DTI', 'Mohammad Erwin Saputra', 'Ops1', 'Ops2', 'Ops3']);
            $table->date('createdDate');
            $table->date('dueDate');
            $table->enum('status', ['open', 'in progress', 'closed', 'resolved']);
            $table->enum('site', ['ITB', 'ITB Jatinangor', 'softwareone']);
            $table->enum('priority', ['High', 'Low', 'Normal', 'Urgent']);
            $table->string('group');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticketing');
    }
};
